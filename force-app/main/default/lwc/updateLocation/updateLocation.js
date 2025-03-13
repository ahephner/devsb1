import { api, track } from "lwc";
import LightningModal from 'lightning/modal';
import LightningAlert from 'lightning/alert';
import { getLocationService } from 'lightning/mobileCapabilities';
export default class UpdateLocation extends LightningModal {
    @api initLatitude
    @api initLongitude
    @api initZipCode; 
    myLocationService
    myLocation;
    handleClose(){
        this.close('cancel')
    }
     getLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser.');
            return;
        }
    
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.initLatitude = latitude; 
                this.initLongitude = longitude;
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.log("User denied the request for Geolocation.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        console.log("The request to get user location timed out.");
                        break;
                    case error.UNKNOWN_ERROR:
                    default:
                        console.log("An unknown error occurred.");
                        break;
                }
            }
        );
    }
    


    success(position){
        console.log(position)
    }
    handleUpdate(){
        let x =  this.template.querySelector('lightning-input-location')
        let lat = Number(x.latitude); 
        let long = Number(x.longitude); 
        let zip = this.template.querySelector('lightning-input').value
        
        if((lat === 0 && long === 0) && zip ===''){
            this.handleAlertClick();
        }else{
            let back = {
                lattitude: lat,
                longitude: long,
                zipCode: zip
            }
            this.close(back)
        }
    }
    async handleAlertClick() {
        await LightningAlert.open({
            message: 'Please fill in a zip or both lat and long',
            theme: 'error', // a red theme intended for error states
            label: 'Error!', // this is the header text
        });
        //Alert has been closed
    }

}