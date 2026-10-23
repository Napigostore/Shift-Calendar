// Text / TextInput dùng phông kiểu Apple (SF trên thiết bị Apple, Inter trên Android, SF/Inter trên web).
import React from 'react';
import { Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps } from 'react-native';
import { appleFont } from '../typography';

export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={appleFont(style)} />;
}

export function TextInput({ style, ...rest }: TextInputProps) {
  return <RNTextInput {...rest} style={appleFont(style)} />;
}
