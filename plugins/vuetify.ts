import '@mdi/font/css/materialdesignicons.css';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

export default defineNuxtPlugin((app) => {
  const myDarkTheme = {
    dark: true,
    colors: {
      background: '#1E1E1E',
      surface: '#3e3e3e',
      primary: '#8f6edf',
      secondary: '#383d7a',
      error: '#B00020',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FB8C00',
    },
    variables: {
      'border-color': '#000000',
      'border-opacity': 0.12,
      'high-emphasis-opacity': 0.87,
      'medium-emphasis-opacity': 0.6,
      'disabled-opacity': 0.38,
      'idle-opacity': 0.04,
      'hover-opacity': 0.04,
      'focus-opacity': 0.12,
      'selected-opacity': 0.08,
      'activated-opacity': 0.12,
      'pressed-opacity': 0.12,
      'dragged-opacity': 0.08,
      'theme-kbd': '#212529',
      'theme-on-kbd': '#FFFFFF',
      'theme-code': '#F5F5F5',
      'theme-on-code': '#000000',
    },
  };

  const vuetify = createVuetify({
    components: {
      VApp: components.VApp,
      VCol: components.VCol,
      VIcon: components.VIcon,
      VImg: components.VImg,
      VProgressLinear: components.VProgressLinear,
      VProgressCircular: components.VProgressCircular,
      VBtn: components.VBtn,
      VFooter: components.VFooter,
      VContainer: components.VContainer,
      VNavigationDrawer: components.VNavigationDrawer,
      VList: components.VList,
      VListItem: components.VListItem,
      VChip: components.VChip,
      VExpansionPanels: components.VExpansionPanels,
      VExpansionPanel: components.VExpansionPanel,
      VExpansionPanelTitle: components.VExpansionPanelTitle,
      VSelect: components.VSelect,
      VRow: components.VRow,
      VNumberInput: components.VNumberInput,
      VTextField: components.VTextField,
      VMain: components.VMain,
      VCard: components.VCard,
      VCardTitle: components.VCardTitle,
      VCardText: components.VCardText,
      VAlert: components.VAlert,
      VAlertTitle: components.VAlertTitle,
    },
    theme: {
      defaultTheme: 'myDarkTheme',
      themes: {
        myDarkTheme,
      },
    },
  });

  app.vueApp.use(vuetify);
});
