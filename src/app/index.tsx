import { Stack } from 'expo-router';
import IDE from '../components/IDE';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'PSJavaScript' }} />
      <IDE />
    </>
  );
}
