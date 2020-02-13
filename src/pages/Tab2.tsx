import React, { useState } from 'react'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonImg, IonActionSheet } from '@ionic/react'
import { camera, trash, close, send } from 'ionicons/icons';
import { usePhotoGallery, Photo } from '../hooks/usePhotoGallery';
import {  useArweave } from '../hooks/useArweave'
import { JWKInterface } from 'arweave/web/lib/wallet';


interface IProps {
  setWallet: any
  wallet: JWKInterface
}

const Tab2: React.FC<IProps> = ({wallet}) => {
  const { deletePhoto, photos, takePhoto } = usePhotoGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo>();
  const {sendPicture } = useArweave(wallet);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Photo Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size="6" key={index}>
                <IonImg onClick={() => setSelectedPhoto(photo)} src={photo.base64uri ?? photo.webviewPath} />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => takePhoto()}>
            <IonIcon icon={camera}></IonIcon>
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={!!selectedPhoto}
          buttons={[{
            text: 'Send',
            icon: send,
            handler: () => {
              if(selectedPhoto){
                sendPicture(selectedPhoto)
              }
            }
          },
          {
            text: 'Delete',
            role: 'destructive',
            icon: trash,
            handler: () => {
              if (selectedPhoto) {
                deletePhoto(selectedPhoto);
                setSelectedPhoto(undefined);
              }
            }
          }, 
          {
            text: 'Cancel',
            icon: close,
            role: 'cancel'
          }]}
          onDidDismiss={() => setSelectedPhoto(undefined)}
        />  
      </IonContent>
    </IonPage>
  );
};

export default Tab2;