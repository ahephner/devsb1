@isTest
private class test_addApp {
  static Area__c area = new Area__c();
  static Program__c prog = new Program__c();
  static Product__c r1 = new Product__c();
  static Product__c r2 = new Product__c();  
  static Application__c Application = new Application__c();
  static Date myDate = Date.newInstance(2040, 1, 4);
    static{
    //product 
     r1.Product_Name__c='Product 1';
     r1.Primary_Category__c = 'Chemicals';
     r1.Subcategory__c ='Chemicals-Herbicide';
     r1.Include_in_Programs__c = True;
     r1.Size__c = 1; 
     
     r2.Product_Name__c='Product 2';
     r2.Primary_Category__c = 'Chemicals';
     r2.Subcategory__c = 'Chemicals-Fungicide';
     r2.Include_in_Programs__c = True;   
     r2.Size__c = 2; 
     insert r1; 
     insert r2;    
        // setup a new account
    Account cust = new Account();
    cust.Name = 'Test123456';
    cust.Type = 'Customer';
    cust.Customer_Name__c = 'Test Customer 123456';
    insert cust;
      
    // create new program
    Program__c prog = new Program__c();
    prog.Name = 'Test Program 2018';
    prog.Account__c = cust.Id;
    insert prog;
    
    // create new area
    area.Name = 'Greens';
    area.Program__c = prog.Id;
    area.Area_Acres__c = 1000;
    insert area;
     
    Application.Name = 'test app';
    Application.Area__c = area.id; 
    Application.Date__c = myDate; 
    insert Application;
    
    }
    //create app wrapper and test insert new app NOTE the appWrapper is in it's own page appWrapper.apxc You can add other details required for capturing info
    //required on the app there then add it below in the test class. Example, if you wanted to get Boolean was it applied? On the file page add Boolean applied get;set;
    //then below add x.applied   true or false 	
    @isTest
    static void testappWrapper(){
       appWrapper x = new appWrapper();
	   x.appName = 'test';
       x.appDate = system.today();
       x.appArea = area.id; 
      Test.startTest(); 
        application__c newApp = addApp.addApplication(x);
      Test.stopTest(); 
        application__c i = [select name from application__c where name =: x.appName];
        system.debug('here is i '+i);
        system.assertEquals(x.appName, i.name); 
    }

 //test update application 
    @isTest
    static void testUpdateApplication(){
       appWrapper x = new appWrapper();
	   x.appName = 'test';
       x.appDate = system.today();
       x.appArea = area.id; 
        Test.startTest();
        	Application__c upApp = addApp.updateApplication(x, Application.Id);
        Test.stopTest(); 
    }
    //test inserting json product list
    @isTest
    static void testAddProducts(){
        list<application_product__c> apList = new list<application_product__c>(); 
        Application_Product__c ap1 = new Application_Product__c(Application__c=application.Id,product__c = r1.id, 
                                                                Rate2__c = 1,Unit_Area__c = 'OZ/M', Note__c ='');
        Application_Product__c ap2 = new Application_Product__c(Application__c=application.Id, product__c = r2.id,
                                                                Rate2__c = 2,Unit_Area__c='LB/M',  Note__c ='');
 
        apList.add(ap1);
        apList.add(ap2);

        String myJSON = JSON.serialize(apList); 
        //system.debug('here is JSON *** ' +myJSON);
        Test.startTest(); 
        	list<Application_Product__c> prodList = addApp.addProducts(myJson);
        Test.stopTest(); 
        	list<Application_Product__c> c = [select id from application_product__c where application__c =: application.Id];
        	system.assertEquals(2, c.size()); 
    }
    //test updating product list 
    @isTest
    static void testUpdateProducts(){
        //create and insert new application products
        list<application_product__c> apList = new list<application_product__c>(); 
        Application_Product__c ap3 = new Application_Product__c(Application__c=application.Id,Product__c = r1.Id, OZ_M__c = 3, Note__c ='');
        Application_Product__c ap4 = new Application_Product__c(Application__c=application.Id,Product__c = r2.Id, OZ_M__c = 4, Note__c ='');
        apList.add(ap3);
        apList.add(ap4);
        insert apList;
        //update above
        list<application_product__c> updates = new list<application_product__c>();     
        Application_Product__c up3 = [select Id, OZ_M__c from application_product__c where product__c = :r1.Id];
        up3.OZ_M__c = 5; 
        updates.add(up3);
        system.debug(up3);
        String newJSON = JSON.serialize(updates); 
        //system.debug('here is JSON *** ' +myJSON);
        Test.startTest(); 
        	list<Application_Product__c> prodList = addApp.updateProducts(newJSON);
        Test.stopTest();

    }
    //test multi-insert
    @isTest 
    static void testMultiInsert(){
        integer occ = 2;
        integer db= 3; 
        Application_Product__c ap1 = new Application_Product__c(Application__c=Application.Id,product__c = r1.id, 
                                                                Rate2__c = 1,Unit_Area__c = 'OZ/M', Note__c ='');
        Application_Product__c ap2 = new Application_Product__c(Application__c=Application.Id, product__c = r2.id,
                                                                Rate2__c = 2,Unit_Area__c='LB/M',  Note__c ='');
        insert ap1;
        insert ap2; 
        system.debug('app id '+Application.Id ); 
        Test.startTest();
         addApp.multiInsert(Application.Id, occ, db); 
        Test.stopTest();
    }

}
