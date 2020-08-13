/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTemplate = /* GraphQL */ `
  mutation CreateTemplate(
    $input: CreateTemplateInput!
    $condition: ModelTemplateConditionInput
  ) {
    createTemplate(input: $input, condition: $condition) {
      id
      site
      facility
      serviceMode
      welcome
      preop
      intra
      pacu
      done
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const updateTemplate = /* GraphQL */ `
  mutation UpdateTemplate(
    $input: UpdateTemplateInput!
    $condition: ModelTemplateConditionInput
  ) {
    updateTemplate(input: $input, condition: $condition) {
      id
      site
      facility
      serviceMode
      welcome
      preop
      intra
      pacu
      done
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
export const deleteTemplate = /* GraphQL */ `
  mutation DeleteTemplate(
    $input: DeleteTemplateInput!
    $condition: ModelTemplateConditionInput
  ) {
    deleteTemplate(input: $input, condition: $condition) {
      id
      site
      facility
      serviceMode
      welcome
      preop
      intra
      pacu
      done
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
    }
  }
`;
