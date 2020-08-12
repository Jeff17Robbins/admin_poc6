import { put, takeEvery } from 'redux-saga/effects';
import { REGISTER_RESOURCE, setSidebarVisibility } from 'react-admin';

function* closeSidebar(action) {
    try {
        if (action.payload) {
            yield put(setSidebarVisibility(false));
        }
    } catch (error) {
        console.log('closeSidebar:', error);
    }
}

function* closeSidebarSaga() {
    yield takeEvery(REGISTER_RESOURCE, closeSidebar);
}

export default closeSidebarSaga;
