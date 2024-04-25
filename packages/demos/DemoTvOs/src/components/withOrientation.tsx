/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/filename-case */
import React from 'react';
import { NativeModules } from 'react-native';

const { OrientationLock } = NativeModules;

export interface OrientationLock {
  setRotationMode: (orientation: RotationMode) => unknown;
}

export enum RotationMode {
  Landscape = 0,
  Portrait = 1,
  Auto = 2,
  LandscapeRight = 3,
  LandscapeLeft = 4,
  PortraitUpright = 5,
  AutoUpright = 6
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withOrientation = (WrappedComponent: any, InitialRotationMode: RotationMode): unknown =>
  class extends React.Component {
    displayName = 'withOrientation';

    // eslint-disable-next-line react/no-deprecated
    UNSAFE_componentWillMount(): void {
      if (InitialRotationMode !== undefined) {
        OrientationLock?.setRotationMode(InitialRotationMode);
      } else {
        OrientationLock?.setRotationMode(RotationMode.Auto);
      }
    }

    setRotationMode = (rotationMode: RotationMode): void => {
      OrientationLock?.setRotationMode(rotationMode);
    };

    render(): JSX.Element {
      return <WrappedComponent setRotationMode={this.setRotationMode} {...this.props} />;
    }
  };
