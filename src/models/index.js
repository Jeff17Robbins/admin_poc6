// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Template } = initSchema(schema);

export {
  Template
};