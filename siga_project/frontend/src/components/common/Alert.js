import React from 'react';
import { 
  Snackbar, 
  Alert as MuiAlert, 
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const Alert = ({ open, message, severity = 'info', duration = 6000, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <MuiAlert
        elevation={6}
        variant="filled"
        severity={severity}
        onClose={onClose}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

export default Alert;