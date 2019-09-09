import React from 'react';
import ReactDom from 'react-dom';
import extractAttributes, { AttributesMap } from './extractAttributes';

export type Options<P = {}> = {
  extends?: string;
  attrs?: string[];
  methods?: string[];
  styles?: string | string[];
  props?: (attributes: AttributesMap, element: HTMLElement) => P;
};

type FunctionMap = {
  [key: string]: Function;
};

const componentInstanceSymbol = Symbol('React component instance');
const shadowRootSymbol = Symbol('Shadow root symbol');

export function createElement<T extends React.ComponentType>(
  Component: T, options: Options<React.ComponentProps<T>> = {}
): typeof HTMLElement {
  const observedAttributes = options.attrs || [];
  const styles = Array.isArray(options.styles) ? options.styles : (
    options.styles ? [options.styles] : []
  );

  function render(this: CustomElement) {
    const element = this;
    const attributes = extractAttributes(observedAttributes, this);
    const props = options.props ? options.props(attributes, this) : attributes;
    const reactElement = React.createElement(Component, props as React.Attributes);

    return ReactDom.render(reactElement, this[shadowRootSymbol] as any, function(this: T) {
      element[componentInstanceSymbol] = this;
    });
  }

  class CustomElement extends HTMLElement {
    static observedAttributes = observedAttributes;

    [componentInstanceSymbol]: T;
    [shadowRootSymbol] = this.attachShadow({ mode: 'open' });

    connectedCallback() {
      render.call(this);

      /**
       * Add styles to the shadow root
       */
      for (const css of styles) {
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(css));

        this[shadowRootSymbol].appendChild(style);
      }
    }

    attributeChangedCallback() {
      render.call(this);
    }

    disconnectedCallback() {
      ReactDom.unmountComponentAtNode(this[shadowRootSymbol] as any);
    }
  }

  if (options.methods) {
    const proto: FunctionMap = {};
    for (const methodName of options.methods) {
      proto[methodName] = function(this: CustomElement, ...args: unknown[]) {
        const component: FunctionMap = this[componentInstanceSymbol] as any;

        return component[methodName] && component[methodName](...args);
      };
    }

    Object.assign(CustomElement.prototype, proto);
  }

  return CustomElement;
}

export default createElement;