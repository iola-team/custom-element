import React from 'react';
import ReactDom from 'react-dom';
import extractAttributes from './extractAttributes';
const componentInstanceSymbol = Symbol('React component instance');
const shadowRootSymbol = Symbol('Shadow root symbol');
;
/**
 * Implementation signature ( class component )
 */
export function createElement(Component, options = {}) {
    var _a;
    const observedAttributes = options.attrs || [];
    const styles = Array.isArray(options.styles) ? options.styles : (options.styles ? [options.styles] : []);
    function render() {
        const attributes = extractAttributes(observedAttributes, this);
        const props = options.props ? options.props(attributes, this) : attributes;
        const ref = options.methods && options.methods.length
            ? (componentInstance) => { this[componentInstanceSymbol] = componentInstance; }
            : undefined;
        const reactElement = React.createElement(Component, Object.assign(Object.assign({}, props), { ref }));
        ReactDom.render(reactElement, this[shadowRootSymbol]);
    }
    class CustomElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this[_a] = this.attachShadow({ mode: 'open' });
        }
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
            ReactDom.unmountComponentAtNode(this[shadowRootSymbol]);
        }
    }
    _a = shadowRootSymbol;
    CustomElement.observedAttributes = observedAttributes;
    if (options.methods) {
        const proto = {};
        for (const methodName of options.methods) {
            proto[methodName] = function (...args) {
                const component = this[componentInstanceSymbol];
                return component[methodName] && component[methodName](...args);
            };
        }
        Object.assign(CustomElement.prototype, proto);
    }
    return CustomElement;
}
export default createElement;
