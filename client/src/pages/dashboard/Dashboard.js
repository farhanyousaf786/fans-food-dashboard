import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Restaurant,
  ShoppingCart as OrdersIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Campaign as PromotionIcon
} from "@mui/icons-material";
import { db } from "../../config/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  getDocs,
  orderBy,
  where,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import MenuItem from "../../models/MenuItem";
import AddMenuDialog from "./components/AddMenuDialod/AddMenuDialog";
import AddPromotionDialog from "./components/AddPromotionDialog/AddPromotionDialog";
import MenuList from "./components/MenuList/MenuList";
import OfferList from "./components/OfferList/OfferList";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [shopData, setShopData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPromotionDialog, setOpenPromotionDialog] = useState(false);


  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    nameMap: { en: '', he: '' },
    description: "",
    descriptionMap: { en: '', he: '' },
    price: "",
    category: "",
    images: [],
    isAvailable: true,
    preparationTime: 15,
    selectedShops: [], // Array of shop IDs for multi-shop support
    customization: {
      options: [],
    },
    allergens: [],
    nutritionalInfo: {},
    foodType: {
      halal: false,
      kosher: false,
      vegan: false
    },
    currency: 'USD',
    offerActive: false,
    discountPercentage: 10,
    hasCOG: false,
    costOfGoods: 0
  });



  useEffect(() => {
    if (location.state?.shopData) {
      setShopData(location.state.shopData);
      localStorage.setItem(
        "currentShopData",
        JSON.stringify(location.state.shopData)
      );
    } else {
      const savedShopData = localStorage.getItem("currentShopData");
      if (savedShopData) {
        setShopData(JSON.parse(savedShopData));
      }
    }
  }, [location]);

  const handleAddMenu = () => {
    setOpenDialog(true);
  };

  const handleAddPromotion = () => {
    setOpenPromotionDialog(true);
  };

  const handleClosePromotionDialog = () => {
    setOpenPromotionDialog(false);
  };

  const handleCloseDialog = () => {
    // Clean up image previews before resetting
    if (newMenuItem.images?.length > 0) {
      newMenuItem.images.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    }
    setOpenDialog(false);
    setNewMenuItem({
      name: "",
      nameMap: { en: '', he: '' },
      description: "",
      descriptionMap: { en: '', he: '' },
      price: "",
      category: "",
      images: [],
      isAvailable: true,
      preparationTime: 15,
      selectedShops: [],
      customization: {
        options: [],
      },
      allergens: [],
      nutritionalInfo: {},
      foodType: {
        halal: false,
        kosher: false,
        vegan: false
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (name.startsWith("foodType.")) {
      // Handle individual foodType checkbox updates
      const key = name.split(".")[1];
      setNewMenuItem((prev) => ({
        ...prev,
        foodType: {
          ...prev.foodType,
          [key]: checked
        }
      }));
    } else if (name.startsWith('nameMap.')) {
      const lang = name.split('.')[1];
      setNewMenuItem((prev) => ({
        ...prev,
        nameMap: {
          ...(prev.nameMap || {}),
          [lang]: value
        }
      }));
    } else if (name.startsWith('descriptionMap.')) {
      const lang = name.split('.')[1];
      setNewMenuItem((prev) => ({
        ...prev,
        descriptionMap: {
          ...(prev.descriptionMap || {}),
          [lang]: value
        }
      }));
    } else if (name === "customization") {
      // Handle customization updates
      setNewMenuItem((prev) => ({
        ...prev,
        customization: value,
      }));
    } else {
      // Handle other field updates - generically handle checkboxes/switches
      const isBooleanField = name === 'hasCOG' || name === 'offerActive' || name === 'isAvailable' || type === 'checkbox';
      const finalValue = isBooleanField ? (checked !== undefined ? checked : !!value) : value;

      setNewMenuItem((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    }
  };

  const handleCreateMenuItem = async (payloadFromDialog) => {
    try {
      if (!shopData?.id || !shopData?.stadiumId) {
        throw new Error('Missing shop data');
      }

      // Use payload passed from AddMenuDialog when available
      const formData = payloadFromDialog || newMenuItem;

      // First upload all images and get their URLs
      const imageUrls = [];
      if (formData.images?.length > 0) {
        for (const image of formData.images) {
          if (image.file) {
            const storageRef = ref(
              storage,
              `menuItems/${shopData.id}/${Date.now()}-${image.file.name}`
            );
            const snapshot = await uploadBytes(storageRef, image.file);
            const url = await getDownloadURL(snapshot.ref);
            imageUrls.push(url);
          }
        }
      }

      // Create MenuItem instance with shopIds array
      const shopIds = formData.selectedShops && formData.selectedShops.length > 0
        ? formData.selectedShops
        : [shopData.id]; // Default to current shop if no shops selected

      const flatName = (formData?.nameMap && formData.nameMap.en) ? formData.nameMap.en : (formData.name || '');
      const flatDescription = (formData?.descriptionMap && formData.descriptionMap.en) ? formData.descriptionMap.en : (formData.description || '');
      const menuItem = new MenuItem(
        flatName,
        formData.nameMap || {},
        flatDescription,
        formData.descriptionMap || {},
        parseFloat(formData.price),
        formData.category, // categoryId
        imageUrls,
        formData.isAvailable,
        parseInt(formData.preparationTime),
        shopIds,
        shopData.stadiumId,
        null, // docId
        formData.customization || {
          options: []
        },
        formData.allergens || [],
        formData.nutritionalInfo || {},
        formData.foodType || {
          halal: false,
          kosher: false,
          vegan: false
        },
        formData.currency || 'USD',
        formData.isCombo || false,
        formData.comboItemIds || [],
        formData.hasCOG || false,
        formData.costOfGoods ? parseFloat(formData.costOfGoods) : 0
      );

      if (newMenuItem.offerActive) {
        // Save in offers collection
        const offerDoc = await addDoc(collection(db, 'offers'), {
          ...menuItem.toFirestore(),
          discountPercentage: Number(newMenuItem.discountPercentage || 0).toFixed(1) * 1,
          active: true
        });
        // Update with docId
        await updateDoc(offerDoc, { docId: offerDoc.id });
      } else {
        // Save in root menuItems collection
        const menuItemsRef = collection(db, 'menuItems');
        const menuItemDoc = await addDoc(menuItemsRef, menuItem.toFirestore());
        // Update with docId
        await updateDoc(menuItemDoc, { docId: menuItemDoc.id });
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error creating menu item:', error);
    }
  };





  return (
    <Box sx={{ pt: 3, pl: 0, pr: 3 }}>
      <Box sx={{ mb: 6, pl: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: 'stretch', md: 'flex-start' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#2D3748",
                fontSize: { xs: "1.5rem", md: "2rem" },
                mb: 1,
              }}
            >
              Dashboard Overview
            </Typography>
            {shopData && (
              <Typography
                variant="subtitle1"
                sx={{
                  color: "#718096",
                  fontSize: "1rem",
                }}
              >
                Manage your shop's menu and promotions
              </Typography>
            )}
          </Box>
          {shopData && (
            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddMenu}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  bgcolor: "#3D70FF",
                  "&:hover": { bgcolor: "#3161EA" },
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  boxShadow: "0 4px 12px rgba(76, 158, 72, 0.2)",
                }}
              >
                Add Menu Item
              </Button>
              <Button
                variant="contained"
                startIcon={<PromotionIcon />}
                onClick={handleAddPromotion}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  bgcolor: "#FF6B35",
                  "&:hover": { bgcolor: "#E55A2B" },
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  boxShadow: "0 4px 12px rgba(255, 107, 53, 0.2)",
                }}
              >
                Promotions
              </Button>
            </Box>
          )}
        </Box>


      </Box>

      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#2D3748",
            fontSize: { xs: "1.5rem", md: "2rem" },
            mb: 1,
            ml: 2,
          }}
        >
          Menu List
        </Typography>
      </Box>
      {shopData ? (
        <>
          {/* Add Menu Item Dialog */}
          <AddMenuDialog
            open={openDialog}
            onClose={handleCloseDialog}
            onSubmit={handleCreateMenuItem}
            menuItem={newMenuItem}
            onChange={handleInputChange}
            shopData={shopData}
          />

          <AddPromotionDialog
            open={openPromotionDialog}
            onClose={handleClosePromotionDialog}
            shopData={shopData}
          />

          <Box ml={2}>
            <MenuList shopData={shopData} />
            <Box sx={{ mt: 4 }}>
              <OfferList shopData={shopData} />
            </Box>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            ml: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <Typography variant="h5" color="text.secondary">
            No shop selected. Please select a shop from the shop panel.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;