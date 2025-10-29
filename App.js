import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import BelanjaFormScreen from "./screens/BelanjaFormScreen";
import DaftarBelanjaScreen from "./screens/DaftarBelanjaScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="BelanjaForm" component={BelanjaFormScreen} />
        <Stack.Screen name="DaftarBelanja" component={DaftarBelanjaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
