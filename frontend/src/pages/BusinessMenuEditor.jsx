import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid,
  TextField, Switch, FormControlLabel, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Stack, Divider, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LaunchIcon from '@mui/icons-material/Launch';
import { Link as RouterLink } from 'react-router-dom';

import { menuService, businessService } from '../services/api';

export const BusinessMenuEditor = () => {
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [businessSlug, setBusinessSlug] = useState('');
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catName, setCatName] = useState('');

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    is_vegetarian: false,
    is_spicy: false,
    is_available: true,
  });

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const [menuRes, bizRes] = await Promise.all([
        menuService.list(),
        businessService.list(),
      ]);
      const mList = menuRes.data.results || menuRes.data;
      setMenus(mList);
      if (mList.length > 0) {
        setSelectedMenu(mList[0]);
      }
      const bList = bizRes.data.results || bizRes.data;
      if (bList.length > 0) {
        setBusinessSlug(bList[0].slug);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!selectedMenu || !catName) return;
    try {
      await menuService.createCategory({
        menu: selectedMenu.id,
        name: catName,
      });
      setCatName('');
      setCatDialogOpen(false);
      loadMenuData();
    } catch (err) {
      alert("Failed to create category");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedCatId || !itemForm.name || !itemForm.price) return;
    try {
      await menuService.createItem({
        category: selectedCatId,
        ...itemForm,
        price: parseFloat(itemForm.price),
      });
      setItemDialogOpen(false);
      setItemForm({
        name: '', description: '', price: '',
        is_vegetarian: false, is_spicy: false, is_available: true
      });
      loadMenuData();
    } catch (err) {
      alert("Failed to create item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Remove this item from the digital menu?")) {
      await menuService.deleteItem(itemId);
      loadMenuData();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Digital Menu Editor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Changes reflect instantly when customers scan your physical table cards
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {businessSlug && (
            <Button
              variant="outlined"
              startIcon={<LaunchIcon />}
              component={RouterLink}
              to={`/business/${businessSlug}/menu`}
              target="_blank"
            >
              Preview Live Mobile Menu
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCatDialogOpen(true)}
          >
            Add Category
          </Button>
        </Stack>
      </Box>

      {!selectedMenu ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">No menu configured yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={4}>
          {selectedMenu.categories?.map((cat) => (
            <Card key={cat.id}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {cat.name}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setItemDialogOpen(true);
                    }}
                  >
                    Add Item
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {cat.items?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No items in this category yet. Click "Add Item" above.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {cat.items?.map((item) => (
                      <Grid size={{ xs: 12, md: 6 }} key={item.id}>
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <Box sx={{ flexGrow: 1, pr: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {item.name}
                              </Typography>
                              {item.is_vegetarian && (
                                <Chip label="VEG" size="small" color="success" sx={{ fontSize: '0.65rem', height: 20 }} />
                              )}
                              {item.is_spicy && (
                                <Chip label="SPICY 🌶" size="small" color="error" sx={{ fontSize: '0.65rem', height: 20 }} />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {item.description || 'Delicious freshly prepared dish.'}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ${parseFloat(item.price).toFixed(2)}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete Item"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Add Category Dialog */}
      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddCategory}>
          <DialogTitle>Add Menu Category</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Category Name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              margin="normal"
              placeholder="e.g. Starters, Main Course, Drinks, Desserts"
              required
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create Category</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddItem}>
          <DialogTitle>Add Menu Item</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Item Name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              margin="normal"
              required
              placeholder="e.g. Hakka Noodles"
              autoFocus
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              margin="normal"
              placeholder="Freshly wok-tossed noodles with bell peppers and chili garlic oil."
            />
            <TextField
              fullWidth
              type="number"
              step="0.01"
              label="Price ($)"
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              margin="normal"
              required
              placeholder="12.50"
            />
            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={itemForm.is_vegetarian}
                    onChange={(e) => setItemForm({ ...itemForm, is_vegetarian: e.target.checked })}
                  />
                }
                label="Vegetarian"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={itemForm.is_spicy}
                    onChange={(e) => setItemForm({ ...itemForm, is_spicy: e.target.checked })}
                  />
                }
                label="Spicy"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Add Item</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
