import React from 'react';
import {
    useNotify,
    useRefresh,
    List,
    Filter,
    Datagrid,
    Edit,
    Create,
    SimpleForm,
    DateField,
    NumberField,
    TextField,
    CloneButton,
    EditButton,
    NumberInput,
    TextInput,
} from 'react-admin';
import { ConflictToolbar } from './ConflictToolbar';
import { makeStyles } from '@material-ui/core/styles';
import BookIcon from '@material-ui/icons/Book';
export const TemplateIcon = BookIcon;

const useStyles = makeStyles({
    ellipsis: {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        width: '3vw',
        overflow: 'hidden',
        OTextOverflow: 'ellipsis',
        textOverflow: 'ellipsis',
    },
    conflict: { color: 'red' },
});

const EllipField = props => {
    const classes = useStyles();
    return <TextField className={classes.ellipsis} {...props} />;
};

const TemplateFilter = props => (
    <Filter {...props}>
        <TextInput label="Search" alwaysOn source="q" />
    </Filter>
);

export const TemplateList = props => (
    <List {...props} filters={<TemplateFilter />}>
        <Datagrid rowClick="edit">
            <TextField source="site" />
            <TextField source="facility" />
            <TextField source="serviceMode" />
            <EllipField source="welcome" />
            <EllipField source="preop" />
            <EllipField source="intra" />
            <EllipField source="pacu" />
            <EllipField source="done" />
            <NumberField disabled source="_version" />
            <DateField disabled showTime source="_lastChangedAt" />
            <EditButton basePath="/templates" />
            <CloneButton />
        </Datagrid>
    </List>
);

const TemplateTitle = ({ record }) => {
    return <span>Template {record ? `"${record.site}"` : ''}</span>;
};

let formState = {};

export const TemplateEdit = props => {
    const classes = useStyles();
    const notify = useNotify();
    const refresh = useRefresh();

    const onFailure = error => {
        const form = error.form;
        formState = form.getState();
        console.log('onFailure: formState=', formState);

        const subset = {};
        for (const key of Object.keys(formState.dirtyFields)) {
            subset[key] = formState.values[key];
        }

        notify(`Could not update template: ${error.message}\n${JSON.stringify(subset)}`, 'warning', {}, false, 10000);
        refresh();
    };

    return (
        <Edit undoable={false} title={<TemplateTitle />} {...props}>
            <SimpleForm
                toolbar={<ConflictToolbar handleFailure={onFailure} />}
                margin="none"
            >
                <TextInput source="site" />
                <TextInput source="facility" />
                <TextInput className={classes.conflict} source="serviceMode" />
                <TextInput fullWidth source="welcome" />
                <TextInput fullWidth source="preop" />
                <TextInput fullWidth source="intra" />
                <TextInput fullWidth source="pacu" />
                <TextInput fullWidth source="done" />
                <TextInput disabled fullWidth source="id" />
                <NumberInput disabled source="_version" />
                <DateField disabled showTime source="_lastChangedAt" />
            </SimpleForm>
        </Edit>
    );
};

export const TemplateCreate = props => (
    <Create title="Create a Template" {...props}>
        <SimpleForm>
            <TextInput source="site" />
            <TextInput source="facility" />
            <TextInput source="serviceMode" />
            <TextInput fullWidth source="welcome" />
            <TextInput fullWidth source="preop" />
            <TextInput fullWidth source="intra" />
            <TextInput fullWidth source="pacu" />
            <TextInput fullWidth source="done" />
        </SimpleForm>
    </Create>
);
