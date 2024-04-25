export enum AttributeNames {
    STATE = 'state',
    EXECUTABLE_AD_UUID = 'executableAdId',
    EXPERIENCE_ID = 'experienceId',
    EXPERIENCE_MEDIA_TYPE = 'adMediaType',
    ABSTRACTION_ID = 'abstractionId',
    ITEM_TYPE = 'itemType',
    ACTION = 'action',
    CONTENT_TYPE = 'contentType'
}

export interface Attributes {
    experienceId: string;
    experienceMediaType: string;
    exeAdUUID: string;
}
