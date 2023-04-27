
const accountingNodeColor = 'rebeccapurple'
const accountingNodeColorChild = 'rgb(77, 38, 117)'
const investmentNodeColor = 'crimson'
const investmentNodeColorChild = 'rgb(184, 28, 59)'
const faovritesNodeColor = 'rgb(53, 153, 168)'
const faovritesNodeColorChild = 'rgb(53, 153, 168)'
 
export const menuColorGl = 'crimson'

export const rootNodesColor = [
  {
    nodes:['Accounting', 'Non-Trade Operations'],  
    color:accountingNodeColor, 
    colorChild:accountingNodeColorChild
  },
  {
    nodes:['Portfolios','Clients','Strategies','Instruments','Trades & Orders'],  
    color:investmentNodeColor,
    colorChild:investmentNodeColorChild
  },
  {
    nodes:['Favorites'],  
    color:faovritesNodeColor,
    colorChild:faovritesNodeColorChild
  }
]
