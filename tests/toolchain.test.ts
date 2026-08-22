import fs from 'node:fs';
import path from 'node:path';

const raiz = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

/** Major declarado num range de semver (`^3.4.19` → 3). */
function major(range: string): number {
  const numero = range.replace(/^[^\d]*/, '').split('.')[0];
  return Number.parseInt(numero ?? '', 10);
}

describe('INV-24 — NativeWind 4 exige Tailwind 3', () => {
  it('INV-24: a versão INSTALADA de tailwindcss é major 3', () => {
    // O `package.json` diz o que foi PEDIDO; `node_modules` tem o que o build
    // usa. O caso que a leitura do package.json não pega: instalação parcial,
    // resolução transitiva, `npm i` interrompido, ou alguém que testou a 4 à mão
    // e não reverteu.
    //
    // Isso importa porque INV-24 existe justamente por a falha ser silenciosa —
    // estilos que não aplicam, sem erro de build. Se a falha é silenciosa,
    // verificar a declaração não basta.
    const instalado = (
      require('tailwindcss/package.json') as { version: string }
    ).version;
    const nativewindInstalado = (
      require('nativewind/package.json') as { version: string }
    ).version;

    expect(major(instalado)).toBe(3);
    expect(major(nativewindInstalado)).toBe(4);
  });

  it('INV-24: o declarado no package.json concorda com o instalado', () => {
    // Tailwind 4 trocou o pipeline de CSS e o NativeWind 4 não o suporta. A
    // atualização é tentadora e silenciosa: `npm i tailwindcss@latest` instala a
    // 4, o app compila, e os estilos simplesmente não aplicam em dispositivo —
    // sem erro de build. Este teste é a única coisa que grita.
    const nativewind = pkg.dependencies.nativewind ?? pkg.devDependencies.nativewind;
    const tailwind = pkg.dependencies.tailwindcss ?? pkg.devDependencies.tailwindcss;

    expect(nativewind).toBeDefined();
    expect(tailwind).toBeDefined();
    expect(major(nativewind!)).toBe(4);
    expect(major(tailwind!)).toBe(3);
  });

  it('INV-24: o preset do NativeWind está no tailwind.config', () => {
    const config = fs.readFileSync(path.join(raiz, 'tailwind.config.js'), 'utf8');
    expect(config).toMatch(/nativewind\/preset/);
  });

  it('INV-24: o jsxImportSource do babel aponta para nativewind', () => {
    // Sem isto o `className` não vira estilo: os componentes renderizam sem erro
    // e sem estilo nenhum.
    const babel = fs.readFileSync(path.join(raiz, 'babel.config.js'), 'utf8');
    expect(babel).toMatch(/jsxImportSource:\s*'nativewind'/);
  });
});

describe('INV-23 — o SecureStore é usado só onde está declarado', () => {
  /**
   * O nome antes era "nenhum armazenamento de token fora do SecureStore", e
   * afirmava exaustividade que estes casos não têm. Eles provam que **o
   * SecureStore** não é usado fora da lista permitida — que é uma classe fechada
   * e verificável.
   *
   * O que NÃO provam: que o token não vaza por outro caminho. `expo-file-system`,
   * um `console.log(token)`, um POST para telemetria ou um cache em objeto global
   * passariam sem tocar `expo-secure-store`. Cobrir isso tem superfície grande e
   * valor decrescente; o que não é aceitável é o nome sugerir que já está coberto.
   */
  it('INV-23: o projeto não depende de AsyncStorage', () => {
    // Se `@react-native-async-storage/async-storage` entrar como dependência,
    // guardar o token nele passa a ser uma linha de código sem nada avisando.
    const todas = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(todas)).not.toContain('@react-native-async-storage/async-storage');
  });

  it('INV-23: só uma lista fechada de arquivos toca no SecureStore', () => {
    // O token é GRAVADO em um lugar só (`lib/api/auth.ts`). Os outros três estão
    // na lista por motivos declarados, não por descuido:
    //
    // - `lib/api/client.ts` LÊ o token para montar o header Authorization. Passar
    //   por `authApi.getToken()` criaria ciclo (auth.ts importa client.ts).
    // - `profile.tsx` e `lib/notifications` guardam preferência de lembrete, que
    //   é dado não sensível.
    //
    // Qualquer arquivo novo aqui reprova o teste, e é isso que se quer: gravar o
    // token em outro lugar não quebra nada em execução.
    const permitidos = [
      path.join('src', 'lib', 'api', 'auth.ts'),
      path.join('src', 'lib', 'api', 'client.ts'),
      path.join('app', '(app)', '(tabs)', 'profile.tsx'),
      path.join('src', 'lib', 'notifications'),
    ];

    function varrer(dir: string): string[] {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
        const completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) return varrer(completo);
        return /\.tsx?$/.test(entrada.name) ? [completo] : [];
      });
    }

    const infratores = [...varrer(path.join(raiz, 'src')), ...varrer(path.join(raiz, 'app'))]
      .filter((arquivo) => fs.readFileSync(arquivo, 'utf8').includes('expo-secure-store'))
      .map((arquivo) => path.relative(raiz, arquivo))
      .filter((relativo) => !permitidos.some((ok) => relativo.startsWith(ok)));

    expect(infratores).toEqual([]);
  });
});
