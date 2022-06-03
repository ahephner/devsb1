import { LightningElement, api, track } from 'lwc';
export default class AppRatePrice extends LightningElement {
           @track data; 
           @api areaSize;
           appTotalPrice;  
           loaded = true; 
           
           @api 
           get selection(){
            return this.data;
           }
           //need to make this private so we can edit this
           set selection(value){
               this.data = JSON.parse(JSON.stringify(value)); 
                console.log('data ' +this.data);
                
           }
//this will set the number of required units based on rate. 
           unitsRequired = (uOFM, rate, areaS, unitS) => {
               return uOFM.includes('Acre') ? Math.ceil((((rate/43.56)*areaS))/unitS) : Math.ceil(((rate*areaS)/unitS))
            }
//user changes the rate for the product
           newRate(e){
            let index = this.data.findIndex(prod => prod.Id === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.data[index].Rate2__c = e.detail.value;
                console.log('ua '+this.data[index].Unit_Area__c);
                
                if(this.data[index].Unit_Area__c != '' && this.data[index].Unit_Area__c != null){
                    this.data[index].Units_Required__c = this.unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Size__c )    
                    this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2);
                    console.log('info = '+this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Size__c);
                    
                }
                
            },500 ) 
           }

           handleUnitArea(e){
               let index = this.data.findIndex(prod => prod.Id === e.target.name);
               console.log('index ' +index + ' detail '+e.detail.value );
               
               this.data[index].Unit_Area__c = e.detail.value;
               
               if(this.data[index].Rate2__c > 0){
                this.data[index].Units_Required__c = this.unitsRequired(this.data[index].Unit_Area__c, this.data[index].Rate2__c, this.areaSize, this.data[index].Size__c );
                this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2)
               }
           }

//Pricing 
           //this is a reuable functions for pricing and line totals
           appTotal = (t, nxt)=> (t+nxt).toFixed(2);
           lineTotal = (units, charge)=> (units * charge).toFixed(2);
           newPrice(e){
                window.clearTimeout(this.delay);
                let index = this.data.findIndex(prod => prod.Id === e.target.name);
                console.log(JSON.stringify(this.data))
                console.log({index}, e.target.name);
                
                this.delay = setTimeout(()=>{
                    this.data[index].Unit_Price__c = e.detail.value;
                    this.data[index].Unit_Price__c = Number(this.data[index].Unit_Price__c);
                    //console.log(typeof this.data[index].Unit_Price__c +' unit Type');          
                        
                        if(this.data[index].Unit_Price__c > 0){
                        this.data[index].Margin__c = Number((1 - (this.data[index].Cost /this.data[index].Unit_Price__c))*100).toFixed(2)
                        this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2)
                        
                       // this.appTotalPrice = this.data.map(el=>Number(el.Total_Price__c)).reduce(this.appTotal)
                        console.log('newPrice if ' + this.appTotalPrice);
                    }else{
                        this.data[index].Margin__c = 0;                
                        this.data[index].Margin__c = this.data[index].Margin__c.toFixed(2)
                        this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2)
                        //console.log(this.data[index].Total_Price__c, 'here price');
                        //this.appTotalPrice = this.data.map(el=> Number(el.Total_Price__c)).reduce(this.appTotal)
                        console.log('price else '+ this.appTotalPrice);
                    }
                    }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.data.findIndex(prod => prod.Id === m.target.name)
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.data[index].Margin__c = Number(m.detail.value);
                            if(1- this.data[index].Margin__c/100 > 0){
                                this.data[index].Unit_Price__c = Number(this.data[index].Cost /(1- this.data[index].Margin__c/100)).toFixed(2);
                                this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2)
                                //this.appTotalPrice = this.data.map(el=> Number(el.Total_Price__c)).reduce(this.appTotal)
                            console.log('margin if ' +this.appTotalPrice);
                            }else{
                                this.data[index].Unit_Price__c = 0;
                                this.data[index].Unit_Price__c = this.data[index].Unit_Price__c.toFixed(2);
                                this.data[index].Total_Price__c = Number(this.data[index].Units_Required__c * this.data[index].Unit_Price__c).toFixed(2)   
                                //this.appTotalPrice = this.data.map(el=> Number(el.Total_Price__c)).reduce(this.appTotal)
                                console.log('margin else ' +this.appTotalPrice);
                                
                            }
                },1500)
            }   
           

           //for the combo box 
           get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'}
            ];
        }
           //flow
           save(){
               
               this.loaded = false; 
               console.log('loaded '+this.loaded);
               
               this.dispatchEvent(new CustomEvent('save',{
                    detail: this.data
               }));    
               //this.loaded = true; 
           }

           cancel(){
               this.dispatchEvent(new CustomEvent('cancel'))
           }
           prodInfo(){
            console.log(this.selection.length);
            console.log('areaSize '+ this.areaSize);
            
            for(let i=0;i<this.selection.length;i++){
                console.log(this.selection[i])

            }
        }
}