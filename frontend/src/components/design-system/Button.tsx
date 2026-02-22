import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends MuiButtonProps {}

const Button: React.FC<ButtonProps> = (props) => {
  return <MuiButton {...props} />;
};

export default Button;
