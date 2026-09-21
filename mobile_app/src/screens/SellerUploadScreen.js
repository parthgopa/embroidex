import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { COLORS } from '../theme/theme';

const SellerUploadScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TopBar showBack onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Ionicons name="cloud-upload-outline" size={56} color={COLORS.primary} style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Upload Embroidery Design</Text>
        <Text style={styles.subtitle}>
          Upload .zip / .emb files, select thumbnails, specify needle count, machine type and set pricing.
        </Text>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>Full Upload Flow in Phase 6</Text>
        </View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.midnight,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  phaseBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  phaseBadgeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default SellerUploadScreen;
