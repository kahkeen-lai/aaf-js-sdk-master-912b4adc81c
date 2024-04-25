import React, { ComponentType, ReactNode } from 'react';
import { AnimatedLoader, youiTypesResolver } from './youi-types';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { ContainerDef, DynamicEvents, InjectionContainer, COMMAND_TRIGGER_HANDLER } from '@xaaf/xaaf-js-sdk';
import { XaafDynamicViewData } from '@xaaf/common';

export interface Renderer {
    render<DynamicViewModel, Element>(dynamicView: DynamicViewModel): Element;
}

export interface ReactElement {
    type: ComponentType<Xaaf.JsonObject>;
    props: Xaaf.JsonObject;
    children: ReactNode[];
}

export class YouiRenderer implements Renderer {
    animationElements: Array<AnimatedLoader> = new Array<AnimatedLoader>();
    onLoad: () => void;
    onError: () => void;
    loadElementsTargetCount = 0;
    timeout = 0;
    onClicked: () => void;

    resetElementsData(): void {
        this.loadElementsTargetCount = 0;
        this.timeout = 0;
        this.animationElements = new Array<AnimatedLoader>();
        this.onLoad = () => {};
        this.onError = () => {};
        this.onClicked = () => {};
    }

    transform(dynamicView: XaafDynamicViewData): ReactElement {
        const children = dynamicView.children?.map((content, index) => {
            if (typeof content === 'string') {
                return content;
            }

            const el: ReactElement = this.transform(content);
            return React.createElement(el.type, { ...el.props, key: index }, el.children);
        });

        const props = this._getDynamicViewProps(dynamicView);

        return {
            type: youiTypesResolver.get(dynamicView.type),
            props: props,
            children
        };
    }

    private _executeTriggeredFunction(event: Xaaf.EventAction): void {
        const context = InjectionContainer.resolve<Map<string, () => void>>(ContainerDef.executableAdStorageService);
        const triggerFunction = context.get(COMMAND_TRIGGER_HANDLER);
        if (event.args) {
            Object.keys(event.args).forEach((eventArg) => {
                ((context as unknown) as Map<string, unknown>).set(eventArg, event.args[eventArg]);
            });
        }
        this.onClicked();
        triggerFunction.apply(this, [event.name, event.action]);
    }

    private _getDynamicViewProps(dynamicView: Xaaf.XaafDynamicViewData): Xaaf.JsonObject {
        const style = (dynamicView.props && dynamicView.props.style) || {};

        let props;
        let _root;

        if (dynamicView.xaaf && dynamicView.xaaf.events) {
            Object.assign(dynamicView.props, {
                ref: (component) => {
                    _root = component;
                }
            });
            dynamicView.xaaf.events.forEach((event) => {
                switch (event.action) {
                    case DynamicEvents.Clicked:
                        if (event.name) {
                            props = {
                                ...dynamicView.props,
                                style,
                                onPress: () => {
                                    this._executeTriggeredFunction(event);
                                }
                            };
                        }
                        break;
                    case 'Loaded':
                        if (this._isDynamicViewImageType(dynamicView.type)) {
                            this.loadElementsTargetCount++;
                            props = {
                                ...dynamicView.props,
                                style,
                                onLoad: () => {
                                    this.onLoad();
                                },
                                onError: () => {
                                    this.onError();
                                }
                            };
                        } else {
                            this.onLoad();
                        }
                        break;
                    case DynamicEvents.Focus:
                        if (event.args) {
                            props = {
                                ...props,
                                ...dynamicView.props,
                                onFocus: () => {
                                    _root.internalRef.setNativeProps(event.args);
                                },
                                onPressIn: () => {
                                    _root.internalRef.setNativeProps(event.args);
                                }
                            };
                        }
                        break;
                    case DynamicEvents.Blur:
                        if (event.args) {
                            props = {
                                ...props,
                                ...dynamicView.props,
                                onBlur: () => {
                                    _root.internalRef.setNativeProps(event.args);
                                }
                            };
                        }
                        break;
                }
            });
        }

        if (props === undefined) {
            props = {
                ...dynamicView.props,
                style
            };
        }
        return props;
    }

    render(dynamicView: Xaaf.XaafDynamicViewData): JSX.Element {
        try {
            this._setTimeout(dynamicView);
            const view = this.transform(dynamicView);
            const el = React.createElement(view.type, view.props, view.children);
            return el;
        } catch (error) {
            throw new Error('failed to create element, ${error}');
        }
    }

    private _isDynamicViewImageType(type: string): boolean {
        return type === 'Image' || type === 'ImageBackground';
    }

    private _setTimeout(dynamicView: Xaaf.XaafDynamicViewData): void {
        if (dynamicView.xaaf && dynamicView.xaaf.timeout) {
            this.timeout = dynamicView.xaaf.timeout;
        }
    }
}

export const youiRenderer = new YouiRenderer();
