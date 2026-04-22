import React, {useEffect, useMemo, useState} from 'react';
import {Image, Text, View, type ImageResizeMode, type StyleProp, type ViewStyle, type ImageStyle} from 'react-native';
import {normalizeRemoteAssetUrl} from '../utils/assets';

type RemoteImageProps = {
  uri?: string | null;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  fallbackText?: string;
  fallbackStyle?: StyleProp<ViewStyle>;
  fallbackTextStyle?: StyleProp<any>;
};

const normalizeDisplayUri = (value?: string | null) => {
  const trimmed = typeof normalizeRemoteAssetUrl(value) === 'string' ? String(normalizeRemoteAssetUrl(value)).trim() : '';
  if (!trimmed) return '';

  try {
    return encodeURI(trimmed).replace(/#/g, '%23');
  } catch {
    return trimmed;
  }
};

export function RemoteImage({
  uri,
  style,
  resizeMode = 'cover',
  fallbackText = '📷',
  fallbackStyle,
  fallbackTextStyle,
}: RemoteImageProps) {
  const normalizedUri = useMemo(() => normalizeDisplayUri(uri), [uri]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [normalizedUri]);

  if (!normalizedUri || failed) {
    return (
      <View style={[
        style as StyleProp<ViewStyle>,
        {alignItems: 'center', justifyContent: 'center'},
        fallbackStyle,
      ]}>
        <Text style={fallbackTextStyle}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{uri: normalizedUri}}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}