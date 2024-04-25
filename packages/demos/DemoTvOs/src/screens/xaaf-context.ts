import {ApiKey, UUID} from './types';
import React from 'react';
import {ApiKeyConfig} from '../config/api-key-config';
import {UuidGenerator} from '@xaaf/aaf-rn-sdk';

export interface XaafContextType {
  selectedApiKey: ApiKey;
  loginRequestId: UUID;
  adRequestId: UUID;
  platformAdvId: 'optout' | UUID;
}

export const XaafContext = React.createContext<XaafContextType>({
  selectedApiKey: ApiKeyConfig.getDefaultKey(),
  loginRequestId: UuidGenerator.generate(),
  adRequestId: UuidGenerator.generate(),
  platformAdvId: 'optout',
});
