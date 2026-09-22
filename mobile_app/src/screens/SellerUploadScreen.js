import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';
import API from '../services/api';
import { pickMainPhoto, pickAdditionalPhotos, pickDesignFile } from '../utils/pickerHelper';

// Available file formats in uppercase matching website order
const FILE_FORMAT_OPTIONS = [
  '.DST', '.PES', '.EMB', '.JEF', '.EXP', '.VP3',
  '.ART', '.XXX', '.HUS', '.VIP', '.SEW'
];

// Design Types (Machines Types) matching website options
const DESIGN_MACHINE_TYPE_OPTIONS = [
  'Flat/Multi Designs',
  'Only Cording Designs',
  'Only Sequin Designs',
  'Only Chain Stitch Designs',
  'Multi+Cording Designs',
  'Multi+Cording+Sequin Designs',
  'Multi+Sequin Designs',
  'Multi+Chain Stitch Designs',
  'Dual & Sandwich Sequin',
  'Cording + Sequin Designs',
  'Beads and Sequin Designs',
  '2/4/6 Sequin Design'
];

// Design Area options matching website
const DESIGN_AREA_OPTIONS = [
  '100 mm', '125 mm', '150 mm', '175 mm', '200 mm',
  '225 mm', '250 mm', '300 mm', '330 mm', '400 mm',
  '500 mm', '600 mm'
];

// Needles options (1 to 15)
const NEEDLES_OPTIONS = Array.from({ length: 15 }, (_, i) => `${i + 1} Needle${i > 0 ? 's' : ''}`);

// Helpful field descriptions for the (i) modal popups
const FIELD_INFO = {
  thumbnail: {
    title: 'Original Photo',
    description:
      'Upload 1 clear front photo of your finished embroidery work (Max 10MB). Clean, authentic photos build trust with buyers and increase design sales significantly.',
    tips: ['Shoot in natural bright light', 'Avoid glare or watermarks', 'Show the complete pattern clearly'],
  },
  additionalImages: {
    title: 'Design Photos',
    description:
      'Upload up to 5 additional close-up photos (Max 10MB each) highlighting stitch textures, thread colors, sequin quality, and reverse-side neatness.',
    tips: ['Capture close-up macro stitch details', 'Show different angles & fabric contrasts', 'Max 5 photos allowed'],
  },
  designFile: {
    title: 'Upload Design File or ZIP',
    description:
      'Upload your machine embroidery design file (e.g. .EMB, .DST, .PES) or a single .ZIP folder containing all machine formats (Max 20MB). Ensure the file is uncorrupted and opens cleanly.',
    tips: ['Supported: .EMB, .DST, .PES, .JEF, .EXP, .VP3, .ZIP', 'Maximum file size: 20MB'],
  },
  fileFormat: {
    title: 'Design File Type / Format',
    description:
      'Select the primary machine embroidery file format. Wilcom .EMB is recommended as it preserves original vectors, stitches, and needle color settings.',
    tips: ['.EMB for Wilcom editable designs', '.DST for Tajima industrial machines', '.PES for Brother embroidery machines'],
  },
  title: {
    title: 'Design Name',
    description:
      'Provide a clear and descriptive name for your design. Good names mention the style, garment type, and motif so buyers can easily search for it.',
    tips: ['Example: Saree Pallu Floral Zari Design', 'Example: Bridal Neck & Blouse Embroidery'],
  },
  category: {
    title: 'Category',
    description:
      'Choose the main product category for this embroidery design. Proper categorization ensures your work appears in relevant marketplace search filters.',
    tips: ['Select from Saree, Blouse, Kurti, Neck, Gala, Lace, etc.'],
  },
  subcategory: {
    title: 'Subcategory',
    description:
      'Select the specialized sub-genre matching your embroidery pattern for targeted discovery by designers and manufacturers.',
    tips: ['Requires choosing a Category first'],
  },
  machineType: {
    title: 'Design Types (Machines Types)',
    description:
      'Specify the embroidery machine configuration required to run this pattern (e.g. Flat/Multi, Cording, Dual Sequin).',
    tips: ['Ensures buyers with specific machine attachments find suitable patterns'],
  },
  area: {
    title: 'Area (Hoop / Frame Size)',
    description:
      'Specify the maximum frame or hoop dimension required to stitch this design without re-hooping.',
    tips: ['Measured in millimeters (e.g., 200 mm, 300 mm, 400 mm)'],
  },
  needles: {
    title: 'Number of Needles',
    description:
      'Indicate the total count of thread needles or color changes required by the embroidery machine.',
    tips: ['Select from 1 to 15 needles'],
  },
  description: {
    title: 'Description',
    description:
      'Enter comprehensive stitch specifications, stitch counts, color sequence notes, recommended stabilizer backing, and fabric advice. Use the toolbar to apply bold, italics, underline, and lists.',
    tips: ['Use formatting buttons (B, I, U, Lists)', 'Click Preview tab to see how buyers view it'],
  },
  price: {
    title: 'Selling Price (₹)',
    description:
      'Set your selling price in Indian Rupees (₹). You receive 70% of every sale directly as royalty, paid to your verified UPI ID or Bank Account.',
    tips: ['Minimum price: ₹10', '70% royalty is credited automatically on completion'],
  },
};

const SellerUploadScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isSeller } = useAuth();

  // Edit Mode detection
  const editDesign = route.params?.design;
  const editId = route.params?.editId || editDesign?._id;
  const isEditMode = Boolean(editId);

  // Form states
  const [thumbnail, setThumbnail] = useState(null); // { uri, name, type, base64 }
  const [existingThumbnailUri, setExistingThumbnailUri] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]); // array of { uri, name, type, base64 }
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]); // array of strings
  const [designFile, setDesignFile] = useState(null); // { uri, name, type, size }
  const [existingFileNames, setExistingFileNames] = useState([]);

  // Order of inputs: File Format, Title, Category, Subcategory, Machine Type, Area, Needles, Description, Price
  const [fileFormat, setFileFormat] = useState('.EMB');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [machineType, setMachineType] = useState(DESIGN_MACHINE_TYPE_OPTIONS[0]);
  const [area, setArea] = useState(DESIGN_AREA_OPTIONS[4]); // 200 mm
  const [needles, setNeedles] = useState('1');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  // Description Rich Text Toolbar state
  const [descSelection, setDescSelection] = useState({ start: 0, end: 0 });
  const [descTab, setDescTab] = useState('write'); // 'write' | 'preview'

  // Dropdown data & modal pickers
  const [categoryMap, setCategoryMap] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal pickers
  const [pickerModal, setPickerModal] = useState({ visible: false, type: '', title: '', items: [] });

  // (i) Information popup modal
  const [infoModal, setInfoModal] = useState({ visible: false, key: null });

  // Helper to resolve thumbnail
  const resolveThumbnailSource = (thumb) => {
    if (!thumb) return null;
    if (thumb.startsWith('data:') || thumb.startsWith('http')) return { uri: thumb };
    return { uri: `data:image/jpeg;base64,${thumb}` };
  };

  // Pre-fill in Edit Mode
  useEffect(() => {
    if (editDesign) {
      setTitle(editDesign.title_original || editDesign.title || '');
      setDescription(editDesign.description_original || editDesign.description || '');
      setCategory(editDesign.category || '');
      setSubcategory(editDesign.subcategory || '');
      setMachineType(editDesign.machine_type || editDesign.design_type || DESIGN_MACHINE_TYPE_OPTIONS[0]);
      setArea(editDesign.area || DESIGN_AREA_OPTIONS[4]);
      setNeedles(String(editDesign.needles || '1'));
      setPrice(String(editDesign.price || ''));

      if (editDesign.file_format) {
        const fmt = editDesign.file_format.startsWith('.')
          ? editDesign.file_format.toUpperCase()
          : `.${editDesign.file_format.toUpperCase()}`;
        if (FILE_FORMAT_OPTIONS.includes(fmt)) {
          setFileFormat(fmt);
        }
      }

      if (editDesign.thumbnail) {
        setExistingThumbnailUri(editDesign.thumbnail);
      }

      if (Array.isArray(editDesign.additional_images)) {
        setExistingAdditionalImages(editDesign.additional_images);
      }

      if (Array.isArray(editDesign.file_names)) {
        setExistingFileNames(editDesign.file_names);
      }
    }
  }, [editDesign]);

  // Load categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/seller/categories');
        const data = res.data?.categories || res.data || {};
        setCategoryMap(data);

        // If not in edit mode and no category selected yet, set first category
        if (!isEditMode && !category) {
          const firstCat = Object.keys(data)[0] || '';
          if (firstCat) {
            setCategory(firstCat);
            const firstSub = data[firstCat]?.[0] || '';
            setSubcategory(firstSub);
          }
        }
      } catch (err) {
        console.warn('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [isEditMode, category]);

  // Update subcategory when category changes
  const handleSelectCategory = (cat) => {
    setCategory(cat);
    const subList = categoryMap[cat] || [];
    setSubcategory(subList[0] || '');
  };

  // Open info modal
  const openInfo = (fieldKey) => {
    setInfoModal({ visible: true, key: fieldKey });
  };

  // Main photo picker
  const handlePickMainPhoto = async () => {
    const img = await pickMainPhoto();
    if (img) {
      setThumbnail(img);
    }
  };

  // Additional photos picker (FIXED BUG: pass totalCurrent so maxAllowed is correctly calculated)
  const handlePickAdditional = async () => {
    const totalCurrent = (existingAdditionalImages?.length || 0) + additionalImages.length;
    if (totalCurrent >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 additional detail photos.');
      return;
    }

    const picked = await pickAdditionalPhotos(totalCurrent);
    if (picked && picked.length > 0) {
      setAdditionalImages((prev) => [...prev, ...picked].slice(0, 5 - (existingAdditionalImages?.length || 0)));
    }
  };

  // Remove existing photo in edit mode
  const removeExistingPhoto = (idx) => {
    setExistingAdditionalImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Remove newly picked photo
  const removeNewPhoto = (idx) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Design file picker
  const handlePickDesignFile = async () => {
    const file = await pickDesignFile();
    if (file) {
      setDesignFile(file);
      // Auto-detect format pill if matching
      const ext = `.${(file.name || '').split('.').pop().toUpperCase()}`;
      if (FILE_FORMAT_OPTIONS.includes(ext)) {
        setFileFormat(ext);
      }
    }
  };

  // Rich Text Formatting function
  const applyFormatting = (tag, placeholder = 'text') => {
    const start = descSelection.start || 0;
    const end = descSelection.end || 0;
    const selected = description.substring(start, end);
    const target = selected.length > 0 ? selected : placeholder;

    let wrapped = '';
    if (tag === 'b') wrapped = `<b>${target}</b>`;
    else if (tag === 'i') wrapped = `<i>${target}</i>`;
    else if (tag === 'u') wrapped = `<u>${target}</u>`;
    else if (tag === 'h3') wrapped = `\n<h3>${target}</h3>\n`;
    else if (tag === 'bullet') wrapped = `\n• ${target}\n`;
    else if (tag === 'number') wrapped = `\n1. ${target}\n`;
    else if (tag === 'specs') {
      wrapped = `\n<b>Stitch Specifications:</b>\n• Total Stitches: \n• Needles / Colors: \n• Fabric: Silk, Cotton, Net\n`;
    }

    const updated = description.substring(0, start) + wrapped + description.substring(end);
    setDescription(updated);
  };

  // Render Rich HTML Preview
  const renderDescriptionPreview = () => {
    if (!description || !description.trim()) {
      return (
        <View style={styles.emptyPreviewBox}>
          <Ionicons name="create-outline" size={28} color={colors.slateMuted} style={{ marginBottom: 6 }} />
          <Text style={[styles.emptyPreviewText, { color: colors.slateMuted }]}>
            No description entered yet. Switch to Write tab to type and apply formatting.
          </Text>
        </View>
      );
    }

    const lines = description.replace(/<br\s*\/?>/gi, '\n').split('\n');

    return (
      <View style={[styles.previewContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <View key={lineIdx} style={{ height: 6 }} />;

          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
          const isHeading = trimmed.includes('<h3>') || trimmed.includes('<h2>');

          const cleanLine = trimmed.replace(/<\/?(h3|h2|p|li|ul|ol)>/gi, '');

          // Tokenize bold, italic, underline
          const parts = [];
          const regex = /(<b>|<strong>|<i>|<em>|<u>)(.*?)(<\/b>|<\/strong>|<\/i>|<\/em>|<\/u>)/gi;
          let lastIdx = 0;
          let match;

          while ((match = regex.exec(cleanLine)) !== null) {
            if (match.index > lastIdx) {
              parts.push({ text: cleanLine.substring(lastIdx, match.index) });
            }
            const tag = match[1].toLowerCase();
            parts.push({
              text: match[2],
              bold: tag === '<b>' || tag === '<strong>',
              italic: tag === '<i>' || tag === '<em>',
              underline: tag === '<u>',
            });
            lastIdx = regex.lastIndex;
          }

          if (lastIdx < cleanLine.length) {
            parts.push({ text: cleanLine.substring(lastIdx) });
          }

          if (parts.length === 0) {
            parts.push({ text: cleanLine });
          }

          return (
            <View
              key={lineIdx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: isHeading ? 8 : 4,
                paddingLeft: isBullet ? 6 : 0,
              }}
            >
              {isBullet && (
                <Text style={{ color: colors.primary, marginRight: 6, fontSize: 14, lineHeight: 18 }}>•</Text>
              )}
              <Text
                style={{
                  flex: 1,
                  fontSize: isHeading ? 15 : 13,
                  lineHeight: isHeading ? 22 : 19,
                  color: isHeading ? colors.primary : colors.midnight,
                  fontWeight: isHeading ? '800' : '400',
                }}
              >
                {parts.map((p, pIdx) => (
                  <Text
                    key={pIdx}
                    style={[
                      p.bold && { fontWeight: '800' },
                      p.italic && { fontStyle: 'italic' },
                      p.underline && { textDecorationLine: 'underline' },
                    ]}
                  >
                    {p.text.replace(/^[•-]\s*/, '')}
                  </Text>
                ))}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Form submission (New Upload OR Update)
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to upload or edit designs.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('LoginScreen') },
      ]);
      return;
    }

    if (!isEditMode && !thumbnail) {
      Alert.alert('Validation Error', 'Please select a Front/Main photo of the embroidery design.');
      return;
    }

    if (isEditMode && !thumbnail && !existingThumbnailUri) {
      Alert.alert('Validation Error', 'A Front photo is required.');
      return;
    }

    if (!isEditMode && !designFile) {
      Alert.alert('Validation Error', 'Please select a design machine file (.EMB, .DST, .ZIP, etc.).');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a design name.');
      return;
    }

    if (!category.trim()) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    if (!subcategory.trim()) {
      Alert.alert('Validation Error', 'Please select a subcategory.');
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid selling price in Rupees.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      formData.append('title', title.trim());
      formData.append('title_original', title.trim());
      formData.append('description', description.trim());
      formData.append('description_original', description.trim());
      formData.append('category', category);
      formData.append('subcategory', subcategory);
      formData.append('machine_type', machineType);
      formData.append('design_type', machineType);
      formData.append('area', area);
      formData.append('needles', needles.replace(/[^0-9]/g, '') || '1');
      formData.append('file_format', fileFormat.replace('.', '').toUpperCase());
      formData.append('price', price.trim());

      // Front Thumbnail
      if (thumbnail) {
        formData.append('thumbnail', {
          uri: thumbnail.uri,
          name: thumbnail.name || 'thumbnail.jpg',
          type: thumbnail.type || 'image/jpeg',
        });
      }

      // Additional images (new)
      additionalImages.forEach((img, idx) => {
        formData.append('additional_images', {
          uri: img.uri,
          name: img.name || `detail_${idx + 1}.jpg`,
          type: img.type || 'image/jpeg',
        });
      });

      // Design File
      if (designFile) {
        formData.append('design_file', {
          uri: designFile.uri,
          name: designFile.name || 'design_file.emb',
          type: designFile.type || 'application/octet-stream',
        });
        formData.append('file_names', JSON.stringify([designFile.name]));
      }

      if (isEditMode) {
        // Kept existing additional images
        formData.append('existing_additional_images_json', JSON.stringify(existingAdditionalImages));

        await API.put(`/seller/design/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        Alert.alert('Success', 'Design updated successfully!');
        navigation.navigate('SellerMyDesignsScreen');
      } else {
        await API.post('/seller/final-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        Alert.alert(
          'Design Submitted!',
          'Your design has been uploaded and submitted for admin review. You can track its status in My Designs.',
          [
            {
              text: 'View My Designs',
              onPress: () => navigation.navigate('SellerMyDesignsScreen'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving design:', error);
      Alert.alert(isEditMode ? 'Update Failed' : 'Upload Failed', error.message || 'Network error occurred while uploading.');
    } finally {
      setSubmitting(false);
    }
  };

  // Subcategories list for active category
  const subcategoryList = category ? categoryMap[category] || [] : [];

  // 70% Live Calculation
  const numericPrice = parseFloat(price) || 0;
  const sellerRoyalty = Math.round(numericPrice * 0.7);

  // Render (i) button
  const renderInfoBtn = (key) => (
    <TouchableOpacity
      onPress={() => openInfo(key)}
      style={styles.infoBtn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Ionicons name="information-circle-outline" size={17} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <View style={styles.headerTitleArea}>
            <Text style={[styles.pageTitle, { color: colors.midnight }]}>
              {isEditMode ? 'Edit Embroidery Design' : 'Upload Design'}
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.slate }]}>
              {isEditMode
                ? 'Update your design photos, specifications, pricing, or embroidery files below.'
                : 'Follow the steps below to publish your embroidery machine file for sale.'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* 1. ORIGINAL PHOTO (FRONT PHOTO) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>
                  Original Photo * <Text style={[styles.labelSubText, { color: colors.slate }]}> (Max 10MB)</Text>
                </Text>
                {renderInfoBtn('thumbnail')}
              </View>

              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.chooseBtn, { backgroundColor: colors.primary }]}
                  onPress={handlePickMainPhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.chooseBtnText}>Choose File</Text>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.fileNameText,
                    { color: thumbnail || existingThumbnailUri ? colors.midnight : colors.slateMuted },
                  ]}
                  numberOfLines={1}
                >
                  {thumbnail
                    ? thumbnail.name || 'Photo selected'
                    : existingThumbnailUri
                    ? 'Current photo loaded'
                    : 'No file chosen'}
                </Text>

                {(thumbnail || existingThumbnailUri) && (
                  <View style={styles.previewThumbWrap}>
                    <Image
                      source={thumbnail ? { uri: thumbnail.base64 || thumbnail.uri } : resolveThumbnailSource(existingThumbnailUri)}
                      style={styles.previewThumb}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeThumbBtn}
                      onPress={() => {
                        setThumbnail(null);
                        setExistingThumbnailUri(null);
                      }}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* 2. DESIGN PHOTOS (UP TO 5 ADDITIONAL) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>
                  Design Photos <Text style={[styles.labelSubText, { color: colors.slate }]}> (Optional • Max 5 photos)</Text>
                </Text>
                {renderInfoBtn('additionalImages')}
              </View>

              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[
                    styles.chooseBtn,
                    {
                      backgroundColor:
                        (existingAdditionalImages.length + additionalImages.length) >= 5
                          ? colors.border
                          : colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handlePickAdditional}
                  disabled={(existingAdditionalImages.length + additionalImages.length) >= 5}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="images-outline"
                    size={16}
                    color={(existingAdditionalImages.length + additionalImages.length) >= 5 ? colors.slateMuted : colors.midnight}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chooseBtnTextAlt,
                      { color: (existingAdditionalImages.length + additionalImages.length) >= 5 ? colors.slateMuted : colors.midnight },
                    ]}
                  >
                    Choose Files
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.fileNameText, { color: colors.slate }]} numberOfLines={1}>
                  {(existingAdditionalImages.length + additionalImages.length) > 0
                    ? `${existingAdditionalImages.length + additionalImages.length} photo${existingAdditionalImages.length + additionalImages.length > 1 ? 's' : ''} selected`
                    : 'No file chosen'}
                </Text>
              </View>

              {/* Gallery Grid */}
              {(existingAdditionalImages.length > 0 || additionalImages.length > 0) && (
                <View style={styles.galleryGrid}>
                  {existingAdditionalImages.map((src, idx) => (
                    <View key={`exist-${idx}`} style={styles.galleryItem}>
                      <Image source={resolveThumbnailSource(src)} style={styles.galleryImg} resizeMode="cover" />
                      <TouchableOpacity style={styles.galleryRemoveBtn} onPress={() => removeExistingPhoto(idx)}>
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {additionalImages.map((img, idx) => (
                    <View key={`new-${idx}`} style={styles.galleryItem}>
                      <Image source={{ uri: img.base64 || img.uri }} style={styles.galleryImg} resizeMode="cover" />
                      <TouchableOpacity style={styles.galleryRemoveBtn} onPress={() => removeNewPhoto(idx)}>
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 3. UPLOAD DESIGN FILE OR ZIP */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>
                  {isEditMode ? 'Design File / ZIP (Optional)' : 'Upload Design File or ZIP *'}
                  <Text style={[styles.labelSubText, { color: colors.slate }]}> (Max 20MB)</Text>
                </Text>
                {renderInfoBtn('designFile')}
              </View>

              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.chooseBtn, { backgroundColor: colors.primary }]}
                  onPress={handlePickDesignFile}
                  activeOpacity={0.8}
                >
                  <Ionicons name="folder-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.chooseBtnText}>Choose File</Text>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.fileNameText,
                    { color: designFile || existingFileNames.length > 0 ? colors.midnight : colors.slateMuted },
                  ]}
                  numberOfLines={1}
                >
                  {designFile
                    ? designFile.name
                    : isEditMode && existingFileNames.length > 0
                    ? `Current: ${existingFileNames.join(', ')}`
                    : 'No file chosen'}
                </Text>
              </View>

              {designFile && (
                <View style={[styles.fileStatusCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                  <Text style={[styles.fileStatusText, { color: colors.midnight }]} numberOfLines={1}>
                    {designFile.name} (Ready)
                  </Text>
                </View>
              )}
            </View>

            {/* 4. DESIGN FILE TYPE / FORMAT */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Design File Type / Format *</Text>
                {renderInfoBtn('fileFormat')}
              </View>

              <View style={styles.formatPillsGrid}>
                {FILE_FORMAT_OPTIONS.map((fmt) => {
                  const isActive = fileFormat === fmt;
                  return (
                    <TouchableOpacity
                      key={fmt}
                      style={[
                        styles.formatPill,
                        {
                          backgroundColor: isActive ? colors.primary : colors.surfaceAlt,
                          borderColor: isActive ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setFileFormat(fmt)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.formatPillText,
                          {
                            color: isActive ? '#ffffff' : colors.midnight,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {fmt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. DESIGN NAME */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Design Name *</Text>
                {renderInfoBtn('title')}
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                ]}
                placeholder="Enter design name (e.g. Saree Pallu Floral Design)"
                placeholderTextColor={colors.slateMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* 6. CATEGORY */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Category *</Text>
                {renderInfoBtn('category')}
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                onPress={() =>
                  setPickerModal({
                    visible: true,
                    type: 'category',
                    title: 'Select Category',
                    items: Object.keys(categoryMap),
                  })
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownBtnText,
                    { color: category ? colors.midnight : colors.slateMuted },
                  ]}
                >
                  {category || (loadingCategories ? 'Loading categories...' : 'Select Category')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* 7. SUBCATEGORY */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Subcategory *</Text>
                {renderInfoBtn('subcategory')}
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                    opacity: category ? 1 : 0.6,
                  },
                ]}
                onPress={() => {
                  if (!category) {
                    Alert.alert('Notice', 'Please select a Category first.');
                    return;
                  }
                  setPickerModal({
                    visible: true,
                    type: 'subcategory',
                    title: 'Select Subcategory',
                    items: subcategoryList,
                  });
                }}
                disabled={!category}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownBtnText,
                    { color: subcategory ? colors.midnight : colors.slateMuted },
                  ]}
                >
                  {subcategory || (category ? 'Select Subcategory' : 'Select category first')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* 8. DESIGN TYPES (MACHINES TYPES) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Design Types (Machines Types) *</Text>
                {renderInfoBtn('machineType')}
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                onPress={() =>
                  setPickerModal({
                    visible: true,
                    type: 'machineType',
                    title: 'Choose Design Types (Machine Types)',
                    items: DESIGN_MACHINE_TYPE_OPTIONS,
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownBtnText, { color: colors.midnight }]}>{machineType}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* 9. AREA */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Area *</Text>
                {renderInfoBtn('area')}
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                onPress={() =>
                  setPickerModal({
                    visible: true,
                    type: 'area',
                    title: 'Choose Area (Hoop Size)',
                    items: DESIGN_AREA_OPTIONS,
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownBtnText, { color: colors.midnight }]}>{area}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* 10. NUMBER OF NEEDLES */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="list-outline" size={16} color={colors.midnight} style={{ marginRight: 6 }} />
                  <Text style={[styles.label, { color: colors.midnight }]}>Number of Needles *</Text>
                </View>
                {renderInfoBtn('needles')}
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                onPress={() =>
                  setPickerModal({
                    visible: true,
                    type: 'needles',
                    title: 'Select Number of Needles',
                    items: NEEDLES_OPTIONS,
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownBtnText, { color: colors.midnight }]}>
                  {needles} {needles.includes('Needle') ? '' : needles === '1' ? 'Needle' : 'Needles'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* 11. DESCRIPTION WITH RICH TEXT FORMATTING TOOLBAR */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>
                  Description * <Text style={[styles.labelSubText, { color: colors.slate }]}> (Bold, italic, color, highlight, lists)</Text>
                </Text>
                {renderInfoBtn('description')}
              </View>

              {/* Rich Formatting Toolbar & Write/Preview Toggle */}
              <View style={[styles.editorToolbar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={styles.formattingButtonsRow}>
                  <TouchableOpacity
                    style={[styles.formatToolBtn, { backgroundColor: colors.surface }]}
                    onPress={() => applyFormatting('b', 'bold text')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formatToolBtnText, { fontWeight: '900', color: colors.midnight }]}>B</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.formatToolBtn, { backgroundColor: colors.surface }]}
                    onPress={() => applyFormatting('i', 'italic text')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formatToolBtnText, { fontStyle: 'italic', color: colors.midnight }]}>I</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.formatToolBtn, { backgroundColor: colors.surface }]}
                    onPress={() => applyFormatting('u', 'underlined text')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formatToolBtnText, { textDecorationLine: 'underline', color: colors.midnight }]}>U</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.formatToolBtn, { backgroundColor: colors.surface }]}
                    onPress={() => applyFormatting('bullet', 'List item')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="list" size={14} color={colors.midnight} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.formatToolBtn, { backgroundColor: colors.surface }]}
                    onPress={() => applyFormatting('number', 'Step 1')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formatToolBtnText, { fontSize: 11, fontWeight: '700', color: colors.midnight }]}>1.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.formatToolBtnWide, { backgroundColor: colors.surface }]}
                    onPress={() => applyFormatting('specs')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="cut-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.formatToolBtnText, { fontSize: 11, color: colors.primary, fontWeight: '700' }]}>Specs</Text>
                  </TouchableOpacity>
                </View>

                {/* Write vs Preview Toggle Tabs */}
                <View style={[styles.descModeToggle, { backgroundColor: colors.surface }]}>
                  <TouchableOpacity
                    style={[
                      styles.descModeBtn,
                      descTab === 'write' && [styles.descModeBtnActive, { backgroundColor: colors.primary }],
                    ]}
                    onPress={() => setDescTab('write')}
                  >
                    <Text style={[styles.descModeBtnText, { color: descTab === 'write' ? '#fff' : colors.slate }]}>
                      Write
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.descModeBtn,
                      descTab === 'preview' && [styles.descModeBtnActive, { backgroundColor: colors.primary }],
                    ]}
                    onPress={() => setDescTab('preview')}
                  >
                    <Text style={[styles.descModeBtnText, { color: descTab === 'preview' ? '#fff' : colors.slate }]}>
                      Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Editor View or Rich HTML Preview */}
              {descTab === 'write' ? (
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                  ]}
                  placeholder="Enter detailed description with styling, stitch notes, and highlights..."
                  placeholderTextColor={colors.slateMuted}
                  multiline
                  numberOfLines={5}
                  value={description}
                  onChangeText={setDescription}
                  onSelectionChange={(e) => setDescSelection(e.nativeEvent.selection)}
                />
              ) : (
                renderDescriptionPreview()
              )}
            </View>

            {/* 12. SELLING PRICE (₹) - STRICTLY BELOW DESCRIPTION */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.midnight }]}>Selling Price (₹) *</Text>
                {renderInfoBtn('price')}
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight, fontWeight: '700' },
                ]}
                placeholder="Price in rupees"
                placeholderTextColor={colors.slateMuted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              {numericPrice > 0 && (
                <View style={[styles.royaltyInfoBox, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                  <Ionicons name="cash-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.royaltyInfoText}>
                    You take home <Text style={{ fontWeight: '800' }}>₹{sellerRoyalty.toLocaleString('en-IN')}</Text> (70% net royalty) per sale.
                  </Text>
                </View>
              )}
            </View>

          </View>

          {/* Submit Button Section */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name={isEditMode ? 'create-outline' : 'cloud-upload-outline'}
                    size={18}
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update Design' : 'Submit Design for Approval'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.submitNote, { color: colors.slate }]}>
              {isEditMode
                ? 'Your design updates will be saved immediately.'
                : 'Your design will be reviewed by our team before being published live.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DROPDOWN SELECTOR MODAL WITH PERSISTENT RIGHT SCROLLBAR & SCROLL HELPER */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModal({ visible: false, type: '', title: '', items: [] })}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerModal({ visible: false, type: '', title: '', items: [] })}
        >
          <View style={[styles.pickerModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.pickerModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <Text style={[styles.pickerModalTitle, { color: colors.midnight }]} numberOfLines={1}>
                  {pickerModal.title}
                </Text>
                <View style={[styles.modalCountBadge, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.modalCountBadgeText, { color: colors.primary }]}>
                    {pickerModal.items.length} options
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPickerModal({ visible: false, type: '', title: '', items: [] })}
              >
                <Ionicons name="close" size={22} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* Scrollable list with visible scroll track indicator and persistent scrollbar */}
            <View style={[styles.scrollListContainer, { borderColor: colors.borderLight }]}>
              <ScrollView
                style={{ maxHeight: 340 }}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                contentContainerStyle={{ paddingRight: 6 }}
              >
                {pickerModal.items.map((item, idx) => {
                  const isSelected =
                    (pickerModal.type === 'category' && category === item) ||
                    (pickerModal.type === 'subcategory' && subcategory === item) ||
                    (pickerModal.type === 'machineType' && machineType === item) ||
                    (pickerModal.type === 'area' && area === item) ||
                    (pickerModal.type === 'needles' && (needles === item || needles === item.split(' ')[0]));

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.pickerModalItem,
                        { borderBottomColor: colors.borderLight },
                        isSelected && [styles.pickerModalItemSelected, { backgroundColor: colors.primaryMuted }],
                      ]}
                      onPress={() => {
                        if (pickerModal.type === 'category') {
                          handleSelectCategory(item);
                        } else if (pickerModal.type === 'subcategory') {
                          setSubcategory(item);
                        } else if (pickerModal.type === 'machineType') {
                          setMachineType(item);
                        } else if (pickerModal.type === 'area') {
                          setArea(item);
                        } else if (pickerModal.type === 'needles') {
                          setNeedles(item);
                        }
                        setPickerModal({ visible: false, type: '', title: '', items: [] });
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerModalItemText,
                          {
                            color: isSelected ? colors.primary : colors.midnight,
                            fontWeight: isSelected ? '800' : '500',
                          },
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Bottom scroll helper note */}
            {pickerModal.items.length > 5 && (
              <View style={[styles.scrollHintFooter, { borderTopColor: colors.borderLight }]}>
                <Ionicons name="chevron-down" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.scrollHintText, { color: colors.slate }]}>
                  Scroll right sidebar to see all {pickerModal.items.length} options
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* (i) INFORMATION POPUP MODAL */}
      <Modal
        visible={infoModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal({ visible: false, key: null })}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setInfoModal({ visible: false, key: null })}
        >
          <View style={[styles.infoModalCard, { backgroundColor: colors.surface }]}>
            {infoModal.key && FIELD_INFO[infoModal.key] && (
              <>
                <View style={styles.infoModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="information-circle" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.infoModalTitle, { color: colors.midnight }]}>
                      {FIELD_INFO[infoModal.key].title}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setInfoModal({ visible: false, key: null })}>
                    <Ionicons name="close" size={22} color={colors.slate} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.infoModalDesc, { color: colors.slate }]}>
                  {FIELD_INFO[infoModal.key].description}
                </Text>

                {FIELD_INFO[infoModal.key].tips && (
                  <View style={[styles.infoModalTipsBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <Text style={[styles.infoModalTipsTitle, { color: colors.midnight }]}>Quick Tips:</Text>
                    {FIELD_INFO[infoModal.key].tips.map((tip, idx) => (
                      <View key={idx} style={styles.tipBulletRow}>
                        <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
                        <Text style={[styles.tipText, { color: colors.slate }]}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.infoModalCloseBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setInfoModal({ visible: false, key: null })}
                >
                  <Text style={styles.infoModalCloseBtnText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitleArea: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    ...SHADOWS.small,
  },
  formGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelSubText: {
    fontSize: 11,
    fontWeight: '400',
  },
  infoBtn: {
    padding: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chooseBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  chooseBtnTextAlt: {
    fontSize: 12,
    fontWeight: '700',
  },
  fileNameText: {
    flex: 1,
    fontSize: 12,
  },
  previewThumbWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  galleryItem: {
    position: 'relative',
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },
  galleryRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  fileStatusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formatPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  formatPillText: {
    fontSize: 12,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  formattingButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  formatToolBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatToolBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 6,
  },
  formatToolBtnText: {
    fontSize: 13,
  },
  descModeToggle: {
    flexDirection: 'row',
    borderRadius: 6,
    padding: 2,
  },
  descModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  descModeBtnActive: {
    ...SHADOWS.subtle,
  },
  descModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textArea: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  previewContainer: {
    minHeight: 100,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  emptyPreviewBox: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyPreviewText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  dropdownBtn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  royaltyInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  royaltyInfoText: {
    color: '#059669',
    fontSize: 12,
    flex: 1,
  },
  submitSection: {
    marginTop: 18,
    marginBottom: 24,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  submitNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    ...SHADOWS.medium,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollListContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    borderRightWidth: 3,
  },
  pickerModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickerModalItemSelected: {},
  pickerModalItemText: {
    fontSize: 14,
  },
  scrollHintFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
  },
  scrollHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    padding: 20,
    ...SHADOWS.medium,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoModalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  infoModalTipsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  infoModalTipsTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  tipBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  tipBullet: {
    fontSize: 14,
    marginRight: 6,
    lineHeight: 16,
  },
  tipText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  infoModalCloseBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SellerUploadScreen;
