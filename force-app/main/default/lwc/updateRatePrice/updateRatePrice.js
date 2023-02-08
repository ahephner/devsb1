import { LightningElement, api, track, wire } from 'lwc';
import appProducts from '@salesforce/apex/appProduct.appProducts'; 
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateApplication from '@salesforce/apex/addApp.updateApplication';
import updateProducts from '@salesforce/apex/addApp.updateProducts';
import { appTotal, alreadyAdded, pref,calcDryFert, calcLiqFert, unitsRequired } from 'c/programBuilderHelper';
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
    @track appTotalPrice = 0.00;
    sqft
    area
    areaUM
    addMore = false; 
    appTotalN;
    appTotalP;
    appTotalK;
    measure = 'M'; 
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
            this.prodlist = resp.map(item =>{
                let allowEdit = item.Product__r.Agency_Pricing__c ? item.Product__r.Agency_Pricing__c : item.Product__r.Agency_Pricing__c
                let nVal = item.Product__r.N__c;
                let pVal = item.Product__r.P__c;
                let kVal = item.Product__r.K__c;
                let type = item.Product__r.Product_Type__c; 
                let isFert = item.Product__r.hasFertilizer__c;
                let galLb = item.Product__r.X1_Gallon_Weight__c
                this.appTotalPrice += item.Total_Price__c
                //console.log(this.appTotalPrice, 2, item.Total_Price__c)
                return {...item, allowEdit, nVal, pVal, kVal,type, isFert, galLb}
            });
             console.log(JSON.stringify(this.prodlist));
            
            
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
             
            this.areaUM = resp[0].Application__r.Area__r.Pref_U_of_M__c; 
            //console.log('type of total price '+ typeof resp[0].Total_Price__c);
            
            console.log('sqft '+resp[0].Application__r.Area__r.Area_Sq_Feet__c);
            
//need for doing math later
            this.areaSize= parseInt(resp[0].Application__r.Area__r.Area_Sq_Feet__c)
            //Not setting total price in the save function so nothing here to pull down yet
            //the other way uses a pb or workflow rule need to update that with SF dec tools. 
            //this.appTotalPrice = this.resp.map(el=> el.Total_Price__c).reduce(this.appTotal)
            
        }).catch((error)=> {
            this.error = error;
            //console.log('error '+JSON.stringify(this.error));
            
        })
    }
    @api
    addProducts(){
        this.addMore = true; 
    }
    @api
    closeAdd(){
        this.addMore = false; 
    }
//updating value functions below
        newAppName(e){
            this.appName = e.detail.value;
        }

        newAppDate(e){
            this.appDate = e.detail.value; 
        }


//get new rate for the product
        newRate(e){
            let index = this.prodlist.findIndex(prod => prod.Product_Code__c === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.prodlist[index].Rate2__c = e.detail.value;
                //console.log('ua '+this.prodlist[index].Unit_Area__c);
                
                if(this.prodlist[index].Unit_Area__c != '' && this.prodlist[index].Unit_Area__c != null){
                    this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSize, this.prodlist[index].Product_Size__c )    
                    this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2);
                    this.appTotalPrice = appTotal(this.prodlist)
                   //console.log(1,this.prodlist[index].Unit_Area__c,2, this.prodlist[index].Rate2__c, 3,this.areaSize,4, this.prodlist[index].Product_Size__c)
                    if(this.prodlist[index].isFert){
                        let fert = this.prodlist[index].Product_Type__c === 'Dry' ? calcDryFert(this.prodlist[index].Rate2__c, this.prodlist[index]) : calcLiqFert(this.prodlist[index].Rate2__c, this.prodlist[index]);
                        this.appTotalN = fert.n;
                        this.appTotalP = fert.p;
                        this.appTotalK = fert.k
                    }
                }
                
            },500 ) 
           }

           handleUnitArea(e){
            let index = this.prodlist.findIndex(prod => prod.Product_Code__c === e.target.name);
            //console.log('index ' +index + ' detail '+e.detail.value );
            
            this.prodlist[index].Unit_Area__c = e.detail.value;
            
            if(this.prodlist[index].Rate2__c > 0){
             this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSize, this.prodlist[index].Product_Size__c );
             this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
            }
        }

        
           lineTotal = (units, charge)=> (units * charge).toFixed(2);
           newPrice(e){
            window.clearTimeout(this.delay);
            let index = this.prodlist.findIndex(prod => prod.Product_Code__c === e.target.name);

            this.delay = setTimeout(()=>{
                this.prodlist[index].Unit_Price__c = e.detail.value;
                this.prodlist[index].Unit_Price__c = Number(this.prodlist[index].Unit_Price__c);
                //console.log(typeof this.prodlist[index].Unit_Price__c +' unit Type');          
                    
                    if(this.prodlist[index].Unit_Price__c > 0){
                    this.prodlist[index].Margin__c = Number((1 - (this.prodlist[index].Product_Cost__c /this.prodlist[index].Unit_Price__c))*100).toFixed(2)
                    this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
                    
                    this.appTotalPrice = appTotal(this.prodlist)
                    //console.log('newPrice if ' + this.appTotalPrice);
                }else{
                    this.prodlist[index].Margin__c = 0;                
                    this.prodlist[index].Margin__c = this.prodlist[index].Margin__c.toFixed(2)
                    this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
                    //console.log(this.prodlist[index].Total_Price__c, 'here price');
                    this.appTotalPrice = appTotal(this.prodlist)
                    //console.log('price else '+ this.appTotalPrice);
                }
                }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.prodlist.findIndex(prod => prod.Product_Code__c === m.target.name)
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.prodlist[index].Margin__c = Number(m.detail.value);
                            if(1- this.prodlist[index].Margin__c/100 > 0){
                                this.prodlist[index].Unit_Price__c = Number(this.prodlist[index].Product_Cost__c /(1- this.prodlist[index].Margin__c/100)).toFixed(2);
                                this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)
                                this.appTotalPrice = appTotal(this.prodlist)
                            
                            }else{
                                this.prodlist[index].Unit_Price__c = 0;
                                this.prodlist[index].Unit_Price__c = this.prodlist[index].Unit_Price__c.toFixed(2);
                                this.prodlist[index].Total_Price__c = Number(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c).toFixed(2)   
                                this.appTotalPrice = this.appTotalPrice = appTotal(this.prodlist)
                                
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
                let index = this.prodlist.findIndex(prod => prod.Product_Code__c === row);
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
//catch new prod
listenNewProd(x){
        const newProd = x.detail.rowProduct;
        const alreadyThere = alreadyAdded(newProd, this.prodlist);
        if(!alreadyThere){
            this.handleNewProd(x)
        }else{
            return; 
        }
}

handleNewProd(x){
    //let passed = x.detail.rowProduct;
    this.prodlist = [...this.prodlist,{
        Id: '',
        Product__c: x.detail.rowProduct,
        Product_Name__c: x.detail.rowName,
        Product_Code__c: x.detail.rowCode,   
        Rate2__c: 0,
        Application__c: this.updateAppId,
        Note__c: '' ,
        Units_Required__c: 1,
        Unit_Area__c: pref(this.areaUM, x.detail.rowProdType),  
        Unit_Price__c: x.detail.rowAgency ? x.detail.rowFlrPrice : x.detail.rowUnitPrice,
        Product_Cost__c: x.detail.rowCost, 
        Margin__c: x.detail.rowAgency ? "" : x.detail.rowMargin, 
        Total_Price__c: x.detail.rowAgency ? x.detail.rowFlrPrice : x.detail.rowUnitPrice,
        Product_Size__c: x.detail.rowSize,
        allowEdit: x.detail.rowAgency ? true : false,
        Area__c:  this.areaId,
        nVal: x.detail.rowN,
        pVal: x.detail.rowP,
        kVal: x.detail.rowK,
        isFert: x.detail.isFert,
        galLb: x.galWeight,
        Product_Type__c: x.detail.rowType

    }]
}


//Update name and products
    @api 
    update(){
        this.loaded = false;
        
        let params = {
            appName: this.appName,
            appDate: this.appDate,
            appArea: this.areaId
        }

        updateApplication({wrapper: params, id:this.appId})
            .then(()=>{
               
                updateProducts({products:this.prodlist})
            }).then((mess)=>{
                //console.log('mess '+mess)
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
                //console.log(JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error adding app',
                        message: JSON.stringify(error),
                        variant: 'error'
                    })  
                ) 
            })
        }
        //Update Pricing and Fertility info displayed to per M or per Acre
    updateMeasure(){
        this.measure = this.measure === 'M' ? 'Acre' : 'M';
   }
    cancel(){
        this.dispatchEvent(new CustomEvent('cancel'))
        
    }
}