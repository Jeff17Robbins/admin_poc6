import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";





export declare class Template {
  readonly id: string;
  readonly site: string;
  readonly facility?: string;
  readonly serviceMode?: string;
  readonly welcome?: string;
  readonly preop?: string;
  readonly intra?: string;
  readonly pacu?: string;
  readonly done?: string;
  constructor(init: ModelInit<Template>);
  static copyOf(source: Template, mutator: (draft: MutableModel<Template>) => MutableModel<Template> | void): Template;
}