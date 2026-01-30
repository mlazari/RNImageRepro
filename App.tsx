import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PhotoManipulator from 'react-native-photo-manipulator';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Camera, PhotoFile, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeAreaView}>
        <AppContent />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(hasPermission);

  useEffect(() => {
    if (!hasPermission && !hasRequestedPermission) {
      requestPermission().then(() => {
        setHasRequestedPermission(true);
      });
    }
  }, [hasPermission, hasRequestedPermission, requestPermission]);

  if (!hasRequestedPermission) return null;

  if (!hasPermission) return <NoPermission />;

  return <CameraView />;
}

function NoPermission() {
  return (
    <View style={styles.container}>
      <Text>Camera permission denied :(</Text>
    </View>
  );
}

function CameraView() {
  const device = useCameraDevice('back');
  const camera = useRef<Camera | null>(null);
  const [photoFile, setPhotoFile] = useState<PhotoFile | null>(null);
  const [croppedPhotoUri, setCroppedPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (photoFile) {
      const cropRegion = {
        x: photoFile.width / 4,
        y: photoFile.height / 4,
        width: photoFile.width / 2,
        height: photoFile.height / 2,
      };
      console.log(photoFile.width, photoFile.height);
      PhotoManipulator.crop(photoFile.path, cropRegion).then(
        uri => { setCroppedPhotoUri(uri); }
      );
    } else {
      setCroppedPhotoUri(null);
    }
  }, [photoFile]);

  const takePhoto = useCallback(async () => {
    if (camera.current === null) return;
    const newPhotoFile = await camera.current?.takePhoto?.();
    setPhotoFile(newPhotoFile);
  }, []);

  const resetPhoto = useCallback(async () => {
    setPhotoFile(null);
  }, []);

  if (!device) return null;

  if (photoFile) {
    return (
      <View style={styles.container}>
        <PhotoPreview title="Original" uri={photoFile.path} />
        <PhotoPreview title="Cropped" uri={croppedPhotoUri} />
        <TouchableOpacity onPress={resetPhoto} style={styles.retakeButton}>
          <Text>Take other photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        ref={camera}
        photo={true}
        zoom={device?.neutralZoom ?? 1}
        enableZoomGesture={true}
      />
      <View style={styles.cameraFooter}>
        <TouchableOpacity onPress={takePhoto}>
          <View style={styles.takePhotoButton} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PhotoPreview({ title, uri }: { title: string, uri: string | null }) {
  return (
    <View style={styles.photoPreviewContainer}>
      <Text>{title}</Text>
      {!!uri && (
        <Image source={{ uri }} style={styles.photoPreviewImage} resizeMode="contain" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: '#FDFBD4'
  },
  cameraFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takePhotoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  photoPreviewContainer: {
    gap: 10,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: 200,
    height: 200,
  },
  retakeButton: {
    backgroundColor: '#636b2f',
    alignSelf: 'center',
    padding: 15,
    borderRadius: 10,
  }
});

export default App;
