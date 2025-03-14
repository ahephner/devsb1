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
    btnText = 'Use Address'; 
    useCords= true;
    
    //street
    street
    city;
    state;
    zip; 

    handleClose(){
        this.close(undefined)
    }
    //get current location of browser; 
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
    messBack; 
    //Toggle Button
    changeInput(evt){
        
        evt.preventDefault();
        if(!this.useCords){
            this.useCords = true;
            this.btnText = 'enter address'
            this.messBack = 'cords'
        }else{
            this.useCords = false;
            this.btnText = 'enter coordinates'
            this.messBack = 'address'
        }

      }
      handleChange(event){
        this.street = event.target.street;
        this.city = event.target.city;
        this.zip = event.target.postalCode;
        this.state =event.target.province;
        this.valid = event.target.valid; 
    }

    success(position){
        console.log(position)
    }
    handleUpdate(){
        let back 
        if(this.messBack === 'cords'){ 
            let x =  this.template.querySelector('lightning-input-location')
            let lat = Number(x.latitude); 
            let long = Number(x.longitude); 
            
            
            if(lat === 0 && long === 0){
                this.handleAlertClick();
            }else{
                 back = {
                    updateHow: this.messBack,
                    lattitude: lat,
                    longitude: long,
                }
                
            }
        }else{
            //String salesforceAddress = '415 Mission Street, San Francisco, CA 94105 USA';
            back = {
                updateHow: this.messBack,
                address: `${this.street}, ${this.city}, ${this.state} ${this.zip} USA`
                
            }
        }
      this.close(back)
    }
    async handleAlertClick() {
        await LightningAlert.open({
            message: 'Please fill both lat and long',
            theme: 'error', // a red theme intended for error states
            label: 'Error!', // this is the header text
        });
        //Alert has been closed
    }
    _country = 'US';
    countryProvinceMap = {
        US: [
        { value: 'Alabama',label: 'AL' },
        { value: 'Alaska', label: 'AK' },
        { value: 'Arizona', label: 'AZ' },
        { value: 'Arkansas', label: 'AR' },
        { value: 'California', label: 'CA' },
        { value: 'Colorado', label: 'CO' },
        { value: 'Connecticut', label: 'CT' },
        { value: 'Delaware', label: 'DE' },
        { value: 'Florida', label: 'FL' },
        { value: 'Georgia', label: 'GA' },
        { value: 'Hawaii', label: 'HI' },
        { value: 'Idaho', label: 'ID' },
        { value: 'Illinois', label: 'IL' },
        { value: 'Indiana', label: 'IN' },
        { value: 'Iowa', label: 'IA' },
        { value: 'Kansas', label: 'KS' },
        { value: 'Kentucky', label: 'KY' },
        { value: 'Louisiana', label: 'LA' },
        { value: 'Maine', label: 'ME' },
        { value: 'Maryland', label: 'MD' },
        { value: 'Massachusetts', label: 'MA' },
        { value: 'Michigan', label: 'MI' },
        { value: 'Minnesota', label: 'MN' },
        { value: 'Mississippi', label: 'MS' },
        { value: 'Missouri', label: 'MO' },
        { value: 'Montana', label: 'MT' },
        { value: 'Nebraska', label: 'NE' },
        { value: 'Nevada', label: 'NV' },
        { value: 'New Hampshire', label: 'NH' },
        { value: 'New Jersey', label: 'NJ' },
        { value: 'New Mexico', label: 'NM' },
        { value: 'New York', label: 'NY' },
        { value: 'North Carolina', label: 'NC' },
        { value: 'North Dakota', label: 'ND' },
        { value: 'Ohio', label: 'OH' },
        { value: 'Oklahoma', label: 'OK' },
        { value: 'Oregon', label: 'OR' },
        { value: 'Pennsylvania', label: 'PA' },
        { value: 'Rhode Island', label: 'RI' },
        { value: 'South Carolina', label: 'SC' },
        { value: 'South Dakota', label: 'SD' },
        { value: 'Tennessee', label: 'TN' },
        { value: 'Texas', label: 'TX' },
        { value: 'Utah', label: 'UT' },
        { value: 'Vermont', label: 'VT' },
        { value: 'Virginia', label: 'VA' },
        { value: 'Washington', label: 'WA' },
        { value: 'West Virginia', label: 'WV' },
        { value: 'Wisconsin', label: 'WI' },
        { value: 'Wyoming', label: 'WY' }
    ]
};

get getProvinceOptions() {
    return this.countryProvinceMap[this._country];
}
}