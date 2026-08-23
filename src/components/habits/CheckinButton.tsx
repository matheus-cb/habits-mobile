import React, { useMemo } from 'react';
import { TouchableOpacity, Text, Animated } from 'react-native';

interface CheckinButtonProps {
  done: boolean;
  onPress: () => void;
  onUndo?: () => void;
  loading?: boolean;
  loadingUndo?: boolean;
}

export function CheckinButton({ done, onPress, onUndo, loading, loadingUndo }: CheckinButtonProps) {
  // `useRef(new Animated.Value(1)).current` era o padrão antigo do React Native
  // e lê um ref durante o render. `useMemo` cria o valor uma vez sem essa leitura.
  const scale = useMemo(() => new Animated.Value(1), []);

  function animate() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  }

  function handlePress() {
    if (done || loading || loadingUndo) return;
    animate();
    onPress();
  }

  function handleLongPress() {
    if (!done || !onUndo || loading || loadingUndo) return;
    animate();
    onUndo();
  }

  const isDisabled = loading || loadingUndo;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        disabled={isDisabled}
        className={`w-11 h-11 rounded-full items-center justify-center ${
          done ? 'bg-purple-600' : 'bg-gray-100 border-2 border-gray-300'
        }`}
      >
        <Text className={`text-xl ${done ? 'text-white' : 'text-gray-400'}`}>
          {loadingUndo ? '…' : done ? '✓' : '○'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
