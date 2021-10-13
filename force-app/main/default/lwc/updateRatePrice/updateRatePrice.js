import { LightningElement, api, track, wire } from 'lwc';
import appProducts from '@salesforce/apex/appProduct.appProducts'; 
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateApplication from '@salesforce/apex/addApp.updateApplication';
import updateProducts from '@salesforce/apex/addApp.updateProducts';

export default class UpdateRatePrice extends LightningElement {
    @api appId; 
    appName; 
    appDate; 
    updateAppId;
    areaId; 
    areaName;
    @track prodlist;
    error; 
    loaded=false; 
    areaSize;
    appTotalPrice;
    sqft
    area
    
    connectedCallback(){
        this.loadProducts();
        //console.log('calling') 
    }
    get unitArea(){
        return [
            {label:'OZ/M', value:'OZ/M'}, 
            {label: 'OZ/Acre', value:'OZ/Acre'},
            {label: 'LB/M', value:'LB/M'},
            {label: 'LB/Acre', value:'LB/Acre'}
        ];
    }
 
  
    loadProducts(){
        appProducts({app: this.appId})
        .then((resp)=>{
            //console.log('running '+resp);
            this.loaded = true; 
            this.prodlist = resp;
            // console.log('test ' +resp[0].Application__r.Name);
            console.log(this.prodlist);
            
            // resp.forEach(element => {
            //     console.log(element);
                
            // });
            this.appName = resp[0].Application__r.Name;
            //console.log('appName '+this.appName);
            this.appDate = resp[0].Application__r.Date__c;
            //console.log('appDate '+this.appDate); 
            this.updateAppId = resp[0].Application__c;
            //console.log('updateAppId '+this.updateAppId); 
            this.areaId = resp[0].Application__r.Area__c
            //console.log('areaId '+this.areaId);
            this.areaName = resp[0].Area__c
            this.appTotalPrice = resp[0].Application__r.Total_Price__c; 
            //console.log('type of total price '+ typeof resp[0].Total_Price__c);
            
            //console.log('sqft '+resp[0].Application__r.Area__r.Area_Sq_Feet__c);
            
//need for doing math later
            this.areaSize= parseInt(resp[0].Application__r.Area__r.Area_Sq_Feet__c)
            //Not setting total price in the save function so nothing here to pull down yet
            //the other way uses a pb or workflow rule need to update that with SF dec tools. 
            //this.appTotalPrice = this.resp.map(el=> el.Total_Price__c).reduce(this.appTotal)
            
        }).catch((error)=> {
            this.error = error;
            console.log('error '+this.error);
            
        })
    }

//updating value functions below
        newAppName(e){
            this.appName = e.detail.value;
        }

        newAppDate(e){
            this.appDate = e.detail.value; 
        }

//this will set the number of required units based on rate. 
        unitsRequired = (uOFM, rate, areaS, unitS) => {
            return uOFM.includes('Acre') ? Math.ceil((((rate/43.56)*areaS))/unitS) : Math.ceil(((rate*areaS)/unitS))
        }
//get new rate for the product
        newRate(e){
            let index = this.prodlist.findIndex(prod => prod.Id === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.prodlist[index].Rate2__c = e.detail.value;
                console.log('ua '+this.prodlist[index].Unit_Area__c);
                
                if(this.prodlist[index].Unit_Area__c != '' && this.prodlist[index].Unit_Area__c != null){
                    this.prodlist[index].Units_Required__c = this.unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSize, this.prodlist[index].Product_Size__c )    
                    this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2);
                    console.log('info = '+this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSize, this.prodlist[index].Product_Size__c);
                    
                }
                
            },500 ) 
           }

           handleUnitArea(e){
            let index = this.prodlist.findIndex(prod => prod.Id === e.target.name);
            console.log('index ' +index + ' detail '+e.detail.value );
            
            this.prodlist[index].Unit_Area__c = e.detail.value;
            
            if(this.prodlist[index].Rate2__c > 0){
             this.prodlist[index].Units_Required__c = this.unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSize, this.prodlist[index].Product_Size__c );
             this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
            }
        }

        appTotal = (t, nxt)=> (t+nxt);
           lineTotal = (units, charge)=> (units * charge).toFixed(2);
           newPrice(e){
            window.clearTimeout(this.delay);
            let index = this.prodlist.findIndex(prod => prod.Id === e.target.name);

            this.delay = setTimeout(()=>{
                this.prodlist[index].Unit_Price__c = e.detail.value;
                this.prodlist[index].Unit_Price__c = Number(this.prodlist[index].Unit_Price__c);
                //console.log(typeof this.prodlist[index].Unit_Price__c +' unit Type');          
                    
                    if(this.prodlist[index].Unit_Price__c > 0){
                    this.prodlist[index].Margin__c = Number((1 - (this.prodlist[index].Product_Cost__c /this.prodlist[index].Unit_Price__c))*100).toFixed(2)
                    this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
                    
                    this.appTotalPrice = this.prodlist.map(el=>Number(el.Total_Price__c)).reduce(this.appTotal)
                    console.log('newPrice if ' + this.appTotalPrice);
                }else{
                    this.prodlist[index].Margin__c = 0;                
                    this.prodlist[index].Margin__c = this.prodlist[index].Margin__c.toFixed(2)
                    this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
                    //console.log(this.prodlist[index].Total_Price__c, 'here price');
                    this.appTotalPrice = this.prodlist.map(el=> Number(el.Total_Price__c)).reduce(this.appTotal)
                    console.log('price else '+ this.appTotalPrice);
                }
                }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.prodlist.findIndex(prod => prod.Id === m.target.name)
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.prodlist[index].Margin__c = Number(m.detail.value);
                            if(1- this.prodlist[index].Margin__c/100 > 0){
                                this.prodlist[index].Unit_Price__c = Number(this.prodlist[index].Product_Cost__c /(1- this.prodlist[index].Margin__c/100)).toFixed(2);
                                this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
                                this.appTotalPrice = this.prodlist.map(el=> Number(el.Total_Price__c)).reduce(this.appTotal)
                            console.log('margin if ' +this.appTotalPrice);
                            }else{
                                this.prodlist[index].Unit_Price__c = 0;
                                this.prodlist[index].Unit_Price__c = this.prodlist[index].Unit_Price__c.toFixed(2);
                                this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)   
                                this.appTotalPrice = this.prodlist.map(el=> Number(el.Total_Price__c)).reduce(this.appTotal)
                                console.log('margin else ' +this.appTotalPrice);
                                
                            }
                },1500)
            }
//remove product from app
removeProd(x){
    const row = x.target.name
    let cf = confirm('Do you want to delete this product');
    if(cf === true){
        deleteRecord(row)
            .then(()=>{
                let index = this.prodlist.findIndex(prod => prod.Id === row);
                this.prodlist.splice(index, 1)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success', 
                        message: 'Product Removed', 
                        variant: 'success'
                    }) 
                )
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: JSON.stringify(error),
                        variant: 'error'
                    })
                )
            })
    }
    
}

//Update name and products
    update(){
        this.loaded = false;
        console.log('name and date and id' +this.appName +' '+ this.appDate+' '+this.appId);
        
        let params = {
            appName: this.appName,
            appDate: this.appDate
        }

        updateApplication({wrapper: params, id:this.appId})
            .then(()=>{
                let products = JSON.stringify(this.prodlist);
                console.log('products '+ products);
                
                updateProducts({products:products})
            }).then(()=>{
                this.prodlist = [];
                this.dispatchEvent(
                    new ShowToastEvent({
                        title:'Success',
                        message:'Updated Products',
                        variant:'success'
                    })
                )
                this.cancel();
            }).catch((error)=>{
                console.log(JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error adding app',
                        message: JSON.stringify(error),
                        variant: 'error'
                    })  
                ) 
            })
        }
    cancel(){
        this.dispatchEvent(new CustomEvent('cancel'))
        
    }
}