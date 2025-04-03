import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';

const ConfirmDialog = ({ open, title, content, onConfirm, onClose, onCancel }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel || onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained" autoFocus>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Create a custom hook to use the confirm dialog
export const useConfirmDialog = () => {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {},
    onCancel: () => {} // Añadir esta propiedad
  });
  
  return { confirmDialog, setConfirmDialog };
};

export default ConfirmDialog;