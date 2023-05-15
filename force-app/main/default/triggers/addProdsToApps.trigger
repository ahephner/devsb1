//trigger to add products to apps on clones.....

trigger addProdsToApps on Application__c ( after insert) {
    string prevID;
    set<Id> appId = new set<ID>(); 
    string value; 
    integer d = 0; 
    for(application__c a: Trigger.new){
        if(a.Prev_App_Id__c != null & a.Clone__c == True){
            string strId = Id.valueOf(a.Id);
            value = strId; 
            prevId = a.prev_app_id__c; 
            appId.add(a.Id); 
        }
    
    
    List<Application_Product__c> prods = [Select  Product__c, Application__c, Area_Square_Feet_M__c,  Product_Name__c,
                                            Categories__c, K__c, K_Calc__c, K_Val__c,LBS_ACRE__c,
                                            N__c,N_Val__c, Note__c, OZ_M__c,P__c, P_Calc__c,
                                            P_Val__c,Product_Category__c, Product_Size__c, name, 
                                            Product_Sub_Category__c, Rate__c, Total_Used_f__c, Units_Required__c
                                          from application_Product__c 
                                          where application__c = :prevID]; 
    system.debug('***** Trigger Prods ----> ' + prods);
   // Map<String, Application_Product__c> addProds = new Map<String, Application_Product__c>();
    
    List<Application_Product__c> products = new List<Application_Product__c>(); 
   // for(application__c b: Trigger.new){
    for(Application_Product__c ap: prods){  
        Application_Product__c x = ap.clone(false);
         x.Application__c = value;
        system.debug('***** Triggerlower loop run ###-> ');
         products.add(x); 
       
    }
    d = d +1; 
    system.debug('***** Trigger Trigger #---> ' + d);
        system.debug('***** Trigger Product List outside insert ' + products);
    if(!products.isEmpty()){
    	upsert products;    
    }
  }
}