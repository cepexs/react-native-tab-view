/* @flow */

import * as React from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import Pager from './Pager';
import { Layout, NavigationState, Route } from './types';

type Props<T: Route> = {
  onIndexChange: (index: number) => mixed,
  navigationState: NavigationState<T>,
  renderScene: (props: {
    route: T,
    jumpTo: (key: string) => void,
  }) => React.ReactNode,
  initialLayout: { width: number, height: number },
  swipeEnabled?: boolean,
  style?: StyleProp<ViewStyle>,
};

type State = {
  layout: Layout,
  renderUnfocusedScenes: boolean,
};

export default class TabView<T: Route> extends React.Component<
  Props<T>,
  State
> {
  static defaultProps = {
    initialLayout: {
      width: 0,
      height: 0,
    },
    getLabelText: ({ route }: { route: Route }) => route.title,
    getAccessibilityLabel: ({ route }: { route: Route }) =>
      typeof route.accessibilityLabel === 'string'
        ? route.accessibilityLabel
        : route.title,
    getTestID: ({ route }: { route: Route }) => route.testID,
  };

  state = {
    layout: { ...this.props.initialLayout, measured: false },
    renderUnfocusedScenes: false,
  };

  componentDidMount() {
    // Delay rendering of unfocused scenes for improved startup
    setTimeout(() => this.setState({ renderUnfocusedScenes: true }), 0);
  }

  _jumpTo = (key: string) => {
    const index = this.props.navigationState.routes.findIndex(
      route => route.key === key
    );

    if (index !== this.props.navigationState.index) {
      this.props.onIndexChange(index);
    }
  };

  _handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    if (
      this.state.layout.width === width &&
      this.state.layout.height === height
    ) {
      return;
    }

    this.setState({
      layout: {
        measured: true,
        height,
        width,
      },
    });
  };

  render() {
    const { navigationState, swipeEnabled, style } = this.props;
    const { layout } = this.state;

    return (
      <View onLayout={this._handleLayout} style={[styles.pager, style]}>
        <Pager
          navigationState={navigationState}
          layout={layout}
          swipeEnabled={swipeEnabled}
          jumpTo={this._jumpTo}
        >
          {({ position, render }) => (
            <React.Fragment>
              {this.props.renderTabBar({ position })}
              {render(
                navigationState.routes.map((route, i) => {
                  const isFocused = i === navigationState.index;

                  return (
                    <View
                      key={route.key}
                      accessibilityElementsHidden={!isFocused}
                      importantForAccessibility={
                        isFocused ? 'auto' : 'no-hide-descendants'
                      }
                      style={[
                        styles.route,
                        // If we don't have the layout yet, make the focused screen fill the container
                        // This avoids delay before we are able to render pages side by side
                        layout.width
                          ? { width: layout.width }
                          : isFocused
                            ? StyleSheet.absoluteFill
                            : null,
                      ]}
                    >
                      {// Don't render unfocused tabs if layout isn't available
                      // Or it's the initial render
                      isFocused ||
                      (this.state.renderUnfocusedScenes && layout.width)
                        ? this.props.renderScene({
                            route,
                            jumpTo: this._jumpTo,
                          })
                        : null}
                    </View>
                  );
                })
              )}
            </React.Fragment>
          )}
        </Pager>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
  route: {
    flex: 1,
    overflow: 'hidden',
  },
});
