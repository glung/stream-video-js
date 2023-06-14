import { Button } from './Button';

import * as data from './Button.data';

export default {
  component: Button,
  subcomponents: {},
  title: 'Button',
};

export const KichinSink = (props: any) => <Button {...props}></Button>;

KichinSink.args = {
  ...data.KichinSink,
};

export const Colors = (props: any) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
    }}
  >
    <Button {...data.KichinSink}></Button>
    <Button {...data.KichinSink} color="secondary"></Button>
    <Button {...data.KichinSink} color="error"></Button>
    <Button {...data.KichinSink} color="transparent"></Button>
    <Button {...data.KichinSink} color="danger"></Button>
    <Button {...data.KichinSink} color="active"></Button>
  </div>
);

export const Shapes = (props: any) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
    }}
  >
    <Button {...data.KichinSink}></Button>
    <Button {...data.KichinSink} shape="square"></Button>
    <Button {...data.KichinSink} shape="oval"></Button>
  </div>
);
