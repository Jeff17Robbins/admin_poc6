import * as React from 'react';
import { Admin, Resource } from 'react-admin';
import closeSidebarSaga from './CloseSidebarSaga';
import appSyncProvider from './appsync-provider';
import {
    TemplateList,
    TemplateEdit,
    TemplateCreate,
    TemplateIcon,
} from './templates';
import englishMessages from 'ra-language-english';
import frenchMessages from 'ra-language-french';
import polyglotI18nProvider from 'ra-i18n-polyglot';

const i18nProvider = polyglotI18nProvider(
    locale => (locale === 'fr' ? frenchMessages : englishMessages),
    'en',
    {
        allowMissing: true,
    }
);

const App = () => (
    <Admin
        i18nProvider={i18nProvider}
        customSagas={[closeSidebarSaga]}
        dataProvider={appSyncProvider(false)}
    >
        <Resource
            name="Templates"
            list={TemplateList}
            edit={TemplateEdit}
            create={TemplateCreate}
            icon={TemplateIcon}
        />
    </Admin>
);

export default App;
