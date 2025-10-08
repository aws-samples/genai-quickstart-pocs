import { defineFunction } from '@aws-amplify/backend';

export const preSignUp = defineFunction({
  name: 'preSignUp',
  environment:{
    ALLOWED_EMAIL_SUFFIXES: ".com,@amazon.com,@amazon.co.uk,@amazon.de,@amazon.fr,@amazon.it,@amazon.es,@amazon.ca,@amazon.com.au,@amazon.com.br,@amazon.co.jp,@amazon.in,@amazon.cn,@amazon.com.mx,@amazon.nl,@amazon.pl,@amazon.se,@amazon.sg,@amazon.sa,@amazon.ae,@amazon.com.tr,@amazon.com.be"
  }
});