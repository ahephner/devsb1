public with sharing class dataFromProductIdCR {
   public with sharing class prodPricing {
       @AuraEnabled
        public Product2 selectedProduct {get; set;} 
       @AuraEnabled
        public pricebookentry bestPrice {get;set;}
    }
    @AuraEnabled
    public static prodPricing prodIdToData(list<string> pIds, string id){
         prodPricing infoBack = new prodPricing(); 
        // Add List of needed info to Select, add ProductID call after where
        // Watch out for objects 
        List<Product2> products = [
            select
            Id,
            Name,
            Product_Type__c,
            Floor_Price__c,
            N__c,
            P__c,
            K__c,
            Product_Cost__c,
            X1_Gallon_Weight__c,
            Size__c,
            hasFertilizer__c,
            Agency_Pricing__c
            from Product2 where id = :id
        ];
        system.debug( products);
        system.debug( pIds);
        
        list<PricebookEntry> price = getPriceBooks.priorityBestPrice(pIds, id);
        system.debug(price);
        if(!price.isEmpty()){
            infoBack.selectedProduct = products[0];
            infoBack.bestPrice = price[0]; 
        }
        return infoBack; 
    }
}