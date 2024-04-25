import React from 'react';
import { XaafText } from './xaaf-text';
import { LOG_LABEL_COLOR, LOG_TEXT_COLOR } from '../styles/styles';

export interface XaafMapProps {
  items: Map<string, string>;
}
interface XaafMapItem {
  label: string;
  text: string;
}
const XaafMap = ({ items }: XaafMapProps): JSX.Element => {
  const itemsArr: XaafMapItem[] = [];
  items?.forEach((val, key) => {
    itemsArr.push({ label: key, text: val });
  });
  return (
    <React.Fragment>
      {itemsArr?.map((item, index) => (
        <React.Fragment key={index}>
          <XaafText value={item.label} color={LOG_LABEL_COLOR} />
          <XaafText value={item.text} color={LOG_TEXT_COLOR} />
        </React.Fragment>
      ))}
    </React.Fragment>
  );
};

export default XaafMap;
