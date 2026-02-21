import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ title, loading, variant = 'primary', disabled, style, ...props }: ButtonProps) {
  const bgClass =
    variant === 'primary'
      ? 'bg-purple-600'
      : variant === 'danger'
      ? 'bg-red-500'
      : 'bg-gray-200';

  const textClass =
    variant === 'secondary' ? 'text-gray-800' : 'text-white';

  return (
    <TouchableOpacity
      className={`${bgClass} rounded-xl px-4 py-3 items-center justify-center flex-row gap-2 ${
        disabled || loading ? 'opacity-50' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ActivityIndicator color={variant === 'secondary' ? '#374151' : '#fff'} size="small" />}
      <Text className={`${textClass} font-semibold text-base`}>{title}</Text>
    </TouchableOpacity>
  );
}
