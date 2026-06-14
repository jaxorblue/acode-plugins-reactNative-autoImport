# React Native Auto Import

<p align="center">

  <a href="https://github.com/jaxorblue/acode-plugins-reactNative-autoImport/stargazers">
  <img src="https://img.shields.io/github/stars/jaxorblue/acode-plugins-reactNative-autoImport?colorA=363a4f&colorB=ffcc15&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij4KPHBhdGggZD0iTTIzNS4yNCw4NC4zOGwtMjguMDYsMjMuNjgsOC41NiwzNS4zOWExMy4zNCwxMy4zNCwwLDAsMS01LjA5LDEzLjkxLDEzLjU0LDEzLjU0LDAsMCwxLTE1LC42OUwxNjQsMTM5bC0zMS42NSwxOS4wNmExMy41MSwxMy41MSwwLDAsMS0xNS0uNjksMTMuMzIsMTMuMzIsMCwwLDEtNS4xLTEzLjkxbDguNTYtMzUuMzlMOTIuNzYsODQuMzhhMTMuMzksMTMuMzksMCwwLDEsNy42Ni0yMy41OGwzNi45NC0yLjkyLDE0LjIxLTMzLjY2YTEzLjUxLDEzLjUxLDAsMCwxLDI0Ljg2LDBsMTQuMjEsMzMuNjYsMzYuOTQsMi45MmExMy4zOSwxMy4zOSwwLDAsMSw3LjY2LDIzLjU4Wk04OC4xMSwxMTEuODlhOCw4LDAsMCwwLTExLjMyLDBMMTguMzQsMTcwLjM0YTgsOCwwLDAsMCwxMS4zMiwxMS4zMmw1OC40NS01OC40NUE4LDgsMCwwLDAsODguMTEsMTExLjg5Wm0tLjUsNjEuMTlMMzQuMzQsMjI2LjM0YTgsOCwwLDAsMCwxMS4zMiwxMS4zMmw1My4yNi01My4yN2E4LDgsMCwwLDAtMTEuMzEtMTEuMzFabTczLTEtNTQuMjksNTQuMjhhOCw4LDAsMCwwLDExLjMyLDExLjMybDU0LjI4LTU0LjI4YTgsOCwwLDAsMC0xMS4zMS0xMS4zMloiIHN0eWxlPSJmaWxsOiAjQ0FEM0Y1OyIvPgo8L3N2Zz4="></a>
  
  <a href="https://github.com/jaxorblue/acode-plugins-reactNative-autoImport/issues">
  <img src="https://img.shields.io/github/issues/jaxorblue/acode-plugins-reactNative-autoImport?colorA=363a4f&colorB=dd5454&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij4KPHBhdGggZD0iTTIxNiwzMlYxOTJhOCw4LDAsMCwxLTgsOEg3MmExNiwxNiwwLDAsMC0xNiwxNkgxOTJhOCw4LDAsMCwxLDAsMTZINDhhOCw4LDAsMCwxLTgtOFY1NkEzMiwzMiwwLDAsMSw3MiwyNEgyMDhBOCw4LDAsMCwxLDIxNiwzMloiIHN0eWxlPSJmaWxsOiAjQ0FEM0Y1OyIvPgo8L3N2Zz4="></a>
  
</p>

**Acode Plugin** — Automatically adds React Native components used in `JSX/TSX` files to the import line.

## 🚀 Features

- It works when you  **save** the file or with the **Alt-M** key combination.
- Supports **90+** React/React Native components and APIs.
- Intelligently updates the existing import line.
- Automatically creates a new import line if none exists.
- Toast notifications.
- Supports `JSX`, `TSX`, `JS`, `TS` files.
- Alphabetical sorting.
- Automatically converts long lines to multi-line format.
- Duplicate import check.

## 📖 Usage

1. Add React Native components to your `JSX/TSX` file:
```jsx
const [state, setState] = useState(initialState);

const App = () => {
  return (
    <View>
      <Text>Hello World</Text>
      <TouchableOpacity>
        <Text>Press Me</Text>
      </TouchableOpacity>
    </View>
  );
}; 
```

2. Save the file or press **Alt + M**

3. The plugin will automatically add/update the import line:
```jsx
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
 ```

 ## 📱 Supported Components

### Core Components
- `View`, `Text`, `Image`, `ScrollView`,
- `FlatList`, `SectionList`,
- `TouchableOpacity`, `Button`,
- `Modal`, `ActivityIndicator`, `StatusBar`,
- `SafeAreaView`,
- **And much more...**

### APIs
- `StyleSheet`, `Platform`, `Dimensions`, `Alert`,
- `Animated`, `Linking`, `Share`, `Keyboard`,
- `AsyncStorage`, `AppState`, `BackHandler`,
- `PanResponder`, `PixelRatio`, `Vibration`
- **And much more...**

### Hooks
- `useState`, `UseEffect`, `useColorScheme`, `useWindowDimensions`
- **And much more...**

### List
- `FlatList`, `SectionList`, `VirtualizedList`

### Styles 
- `StyleSheet`


## 💡 How Does It Work?

1. Reads the contents of the active file.
2. Scans JSX tags and API usage.
3. Identifies components that can be imported from React/React Native.
4. Finds and updates the existing import line (or creates a new one).
5. Displays newly added components with a toast notification.

## ⚙️ Settings 
- Customize the automatic import shortcut key.
- Show and hide import notifications.

## 🐛 Bug Reporting and Contribution

- You can report any bugs you encounter or new feature requests via the GitHub repository (from the Issues tab).

- If you think there are any missing components, please let us know so we can add them.

- If you would like to contribute code, feel free to submit a Pull Request (PR)!

**🔗 GitHub Issues `=>`**
[![GitHub](https://img.shields.io/badge/GitHub-jaxorblue-orange?logo=github)](https://github.com/jaxorblue/acode-plugins-reactNative-autoImport/issues)

## 🧑‍💻 Author

[![GitHub](https://img.shields.io/badge/GitHub-jaxorblue-orange?logo=github)](https://github.com/jaxorblue)

[![Email](https://img.shields.io/badge/Email-jaxorblue@gmail.com-blue)](mailto:jaxorblue@gmail.com)

### 🌟 Star on GitHub

If you find the React Native Auto Import plugin useful, we encourage you to rate it with stars on GitHub.

This is a simple way to show your appreciation and help others discover the project. Help make the React Native Auto Import plugin better for the whole community, whether through code or a simple star rating.

❤️ Thank you for your support!
