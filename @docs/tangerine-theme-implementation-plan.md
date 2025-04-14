# Tangerine Theme Implementation Plan for Flutter

## Objective

Recreate the provided Tangerine Tailwind CSS palette as a comprehensive Flutter theme, supporting both light and dark modes, and apply it consistently across the app.

---

## Step-by-Step Plan

### 1. Analyze and Map the Tangerine Palette

- Map each CSS variable to a Flutter color property (primary, background, surface, error, etc.).
- Identify which colors are best suited for Material color roles.
- Plan for both light and dark theme mappings.

### 2. Define Color Constants

- Create a Dart file (e.g., `tangerine_colors.dart`) in `lib/shared/theme/`.
- Define all color constants using the provided RGB values for both light and dark modes.

### 3. Create ThemeData for Light and Dark Modes

- In `theme.dart`, define two ThemeData objects (light and dark) using the color constants.
- Set up colorScheme, backgroundColor, scaffoldBackgroundColor, cardColor, etc.
- Set up textTheme to use Inter (or fallback to system sans-serif).

### 4. Integrate Theme into the App

- Update `app.dart` to use the new ThemeData for both light and dark modes.
- Ensure the app can switch between light and dark themes (using system brightness or a toggle).

### 5. Refactor Widgets to Use Theme Colors

- Refactor custom widgets (cards, buttons, modals, etc.) to use Theme.of(context) colors instead of hardcoded values.
- Ensure all UI elements (AppBar, BottomNavigationBar, backgrounds, etc.) use the new theme.

### 6. Handle Special Colors

- Use chart colors for fl_chart.
- Use sidebar colors for navigation if applicable.
- Use accent, muted, destructive, etc., for appropriate UI elements.

### 7. Test and Polish

- Test the app in both light and dark modes.
- Adjust for accessibility and contrast.
- Ensure all screens and widgets look consistent with the Tangerine palette.

---

## Potential Challenges & Considerations

- Mapping all CSS variables to Flutter theme roles may require some design decisions.
- Ensuring all widgets use theme colors (not hardcoded) may require refactoring.
- Font family (Inter) may need to be added to pubspec.yaml and loaded as an asset.
- Some CSS variables (e.g., sidebar, chart colors) may not have direct Flutter equivalents and will need to be used in custom widgets.
- Testing for contrast and accessibility, especially in dark mode.

---

## Summary Table

| Step | Description | Dependencies | Challenges |
|------|-------------|--------------|------------|
| 1 | Map CSS palette to Flutter theme | Provided CSS | Design decisions |
| 2 | Define color constants | Step 1 | None |
| 3 | Create ThemeData (light/dark) | Step 2 | Flutter theming API |
| 4 | Integrate theme in app | Step 3 | App structure |
| 5 | Refactor widgets to use theme | Step 4 | Refactoring effort |
| 6 | Handle special colors | Step 2 | Custom widget logic |
| 7 | Test and polish | All above | Visual QA, accessibility |

---

## Next Steps

- Review this plan and adjust mappings as needed.
- Begin implementation following the outlined steps for a consistent Tangerine theme across the app.