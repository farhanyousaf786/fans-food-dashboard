import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { auth, db } from '../../../config/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import ShopAdminCard from './ShopAdminCard';
import AddAdminDialog from './AddAdminDialog';

const ShopAdminManager = () => {
  const [allShopOwners, setAllShopOwners] = useState([]);
  const [userShops, setUserShops] = useState([]);
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    // Get current shop data from localStorage (for stadium context)
    const savedShopData = localStorage.getItem('currentShopData');
    if (savedShopData) {
      setShopData(JSON.parse(savedShopData));
    }
    fetchAllShopOwners();
    fetchUserShops();
  }, [shopData]);

  const fetchAllShopOwners = async () => {
    try {
      // Fetch from shopowners collection directly
      const shopOwnersCollection = collection(db, 'shopowners');
      const shopOwnersSnapshot = await getDocs(shopOwnersCollection);
      const shopOwners = shopOwnersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }));

      setAllShopOwners(shopOwners);
      console.log('🏪 SHOP ADMIN MANAGER: Found shop owners:', shopOwners.length);
    } catch (error) {
      console.error('Error fetching shop owners:', error);
    }
  };

  const fetchUserShops = async () => {
    try {
      const shopsCollection = collection(db, 'shops');
      let shopsQuery;
      
      // If admin has stadium context, only fetch shops from that stadium
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.role === 'admin' && shopData?.stadiumId) {
        shopsQuery = query(shopsCollection, where('stadiumId', '==', shopData.stadiumId));
      } else {
        shopsQuery = query(shopsCollection); // Fetch all for other cases
      }
      
      const shopsSnapshot = await getDocs(shopsQuery);
      const allShops = shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (user && user.role === 'admin') {
        // Admin sees shops from current stadium (or all if no stadium context)
        setUserShops(allShops);
        console.log('🏪 SHOP ADMIN MANAGER: Admin user - showing stadium shops:', allShops.length);
      } else {
        // Filter shops where current user is admin
        const currentUserId = auth.currentUser?.uid || user?.id;
        const userShops = allShops.filter(shop =>
          shop.admins && shop.admins.includes(currentUserId)
        );
        setUserShops(userShops);
        console.log('🏪 SHOP ADMIN MANAGER: User shops:', userShops.length);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user shops:', error);
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedShop || !selectedOwner) return;

    try {
      const shopRef = doc(db, 'shops', selectedShop.id);
      const currentAdmins = selectedShop.admins || [];

      if (!currentAdmins.includes(selectedOwner)) {
        const updatedAdmins = [...currentAdmins, selectedOwner];
        await updateDoc(shopRef, { admins: updatedAdmins });

        // Update local state
        setUserShops(prev => prev.map(shop =>
          shop.id === selectedShop.id
            ? { ...shop, admins: updatedAdmins }
            : shop
        ));

        console.log('✅ SHOP ADMIN MANAGER: Admin added to shop:', selectedShop.name);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  };

  const handleRemoveAdmin = async (shopId, adminId) => {
    try {
      const shopRef = doc(db, 'shops', shopId);
      const shop = userShops.find(s => s.id === shopId);
      const updatedAdmins = shop.admins.filter(id => id !== adminId);

      await updateDoc(shopRef, { admins: updatedAdmins });

      // Update local state
      setUserShops(prev => prev.map(shop =>
        shop.id === shopId
          ? { ...shop, admins: updatedAdmins }
          : shop
      ));

      console.log('❌ SHOP ADMIN MANAGER: Admin removed from shop');
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  };

  const handleOpenDialog = (shop) => {
    setSelectedShop(shop);
    setOpenAdminDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAdminDialog(false);
    setSelectedShop(null);
    setSelectedOwner('');
  };

  const handleOwnerChange = (e) => {
    setSelectedOwner(e.target.value);
  };

  const getOwnerName = (ownerId) => {
    const owner = allShopOwners.find(o => o.id === ownerId);
    return owner ? owner.name : 'Unknown User';
  };

  if (loading) {
    return <Typography>Loading shops...</Typography>;
  }

  return (
    <>
      <Typography variant="h5" className="admin-section-title">
        Shop Admin Management
      </Typography>

      {userShops.length === 0 ? (
        <Typography className="no-shops-message">
          You don't have access to any shops yet.
        </Typography>
      ) : (
        <div className="shops-container">
          {userShops.map((shop) => (
            <ShopAdminCard
              key={shop.id}
              shop={shop}
              onAddAdmin={handleOpenDialog}
              onRemoveAdmin={handleRemoveAdmin}
              getOwnerName={getOwnerName}
            />
          ))}
        </div>
      )}

      <AddAdminDialog
        open={openAdminDialog}
        onClose={handleCloseDialog}
        selectedShop={selectedShop}
        allShopOwners={allShopOwners}
        selectedOwner={selectedOwner}
        onOwnerChange={handleOwnerChange}
        onAddAdmin={handleAddAdmin}
      />
    </>
  );
};

export default ShopAdminManager;
