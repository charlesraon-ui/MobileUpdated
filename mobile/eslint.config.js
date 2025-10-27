// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Custom rule to prevent direct display of ID fields in Text components
      'no-id-display': 'error',
    },
    plugins: {
      'custom': {
        rules: {
          'no-id-display': {
            meta: {
              type: 'problem',
              docs: {
                description: 'Prevent direct display of _id or id fields in Text components',
                category: 'Security',
                recommended: true,
              },
              fixable: null,
              schema: [],
            },
            create(context) {
              return {
                JSXElement(node) {
                  // Check if this is a Text component
                  if (node.openingElement.name.name === 'Text') {
                    // Check children for ID display patterns
                    const checkForIdDisplay = (child) => {
                      if (child.type === 'JSXExpressionContainer') {
                        const expression = child.expression;
                        
                        // Check for direct _id or id access like {item._id} or {product.id}
                        if (expression.type === 'MemberExpression') {
                          const property = expression.property;
                          if (property && (property.name === '_id' || property.name === 'id')) {
                            context.report({
                              node: child,
                              message: 'Direct display of ID fields (_id, id) in Text components is prohibited for security reasons. Use sanitized data instead.',
                            });
                          }
                        }
                        
                        // Check for template literals that might contain IDs
                        if (expression.type === 'TemplateLiteral') {
                          expression.expressions.forEach(expr => {
                            if (expr.type === 'MemberExpression') {
                              const property = expr.property;
                              if (property && (property.name === '_id' || property.name === 'id')) {
                                context.report({
                                  node: child,
                                  message: 'Direct display of ID fields (_id, id) in template literals within Text components is prohibited.',
                                });
                              }
                            }
                          });
                        }
                      }
                    };
                    
                    // Check all children of the Text component
                    if (node.children) {
                      node.children.forEach(checkForIdDisplay);
                    }
                  }
                },
              };
            },
          },
        },
      },
    },
  },
]);
