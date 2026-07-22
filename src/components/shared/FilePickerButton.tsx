import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors, radii, spacing, typography } from '@/theme';
import { Icon } from './Icon';
import { Pressable } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export interface FilePickerHandle {
  open: () => void;
}

interface FilePickerButtonProps {
  onPicked: (file: PickedFile) => void;
  allowDocuments?: boolean;
  label?: string;
}

/**
 * Bottom sheet "Tomar foto / Elegir de galería / Elegir archivo" — usado en
 * adjuntos de tickets, evidencias de mediación y documentos de liquidación.
 */
export const FilePickerButton = forwardRef<FilePickerHandle, FilePickerButtonProps>(
  ({ onPicked, allowDocuments = true, label = 'Adjuntar archivo' }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
    }));

    const snapPoints = useMemo(() => ['32%'], []);

    const close = () => sheetRef.current?.dismiss();

    const handleCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        close();
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      close();
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onPicked({ uri: asset.uri, name: asset.fileName ?? `foto_${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' });
      }
    };

    const handleGallery = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        close();
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      close();
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onPicked({ uri: asset.uri, name: asset.fileName ?? `imagen_${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' });
      }
    };

    const handleDocument = async () => {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
      close();
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onPicked({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' });
      }
    };

    return (
      <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={styles.sheetBg}>
        <BottomSheetView style={styles.container}>
          <Text style={typography.title}>{label}</Text>
          <View style={styles.options}>
            <Pressable style={styles.option} onPress={handleCamera}>
              <Icon name="camera-outline" size={22} color={colors.brand} />
              <Text style={styles.optionText}>Tomar foto</Text>
            </Pressable>
            <Pressable style={styles.option} onPress={handleGallery}>
              <Icon name="images-outline" size={22} color={colors.brand} />
              <Text style={styles.optionText}>Elegir de galería</Text>
            </Pressable>
            {allowDocuments ? (
              <Pressable style={styles.option} onPress={handleDocument}>
                <Icon name="document-attach-outline" size={22} color={colors.brand} />
                <Text style={styles.optionText}>Elegir archivo</Text>
              </Pressable>
            ) : null}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

FilePickerButton.displayName = 'FilePickerButton';

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  container: { padding: spacing.xl, gap: spacing.lg },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  optionText: { ...typography.bodyLg },
});
