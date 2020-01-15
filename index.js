import { setProperties, getNodesByType, modifyNodesByName } from 'idyll-ast';
import { getVars } from 'idyll-document/dist/cjs/utils/index'
import fs from 'fs';

const hashCode = (s) => {
  return "" + Math.abs(s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
}

const buildComponent = (contents, id, vars) => {
  const jsURL = 'https://cdn.jsdelivr.net/npm/p5@0.10.2/lib/p5.js';
  return `
    const React = require('react');
    const select = require('d3-selection').select;

    class p5js${id} extends React.Component {
      constructor(props) {
        super(props);
      }

      componentDidMount() {
        const jsId = 'idyll-p5js-minified';
        if (
          document &&
          !document.getElementById(jsId) &&
          !select('script[src = "${jsURL}"]').size()
        ) {
          const heads = document.getElementsByTagName('head');
          if (heads.length) {
            const head = heads[0];
            const link = document.createElement('script');
            link.src = '${jsURL}';
            head.appendChild(link);
          }
        }

        const heads = document.getElementsByTagName('head');
        if (heads.length) {
          const head = heads[0];
          const script = document.createElement('script');
          script.id = 'p5js${id}';
          const { hasError, updateProps, idyll, children, ...props } = this.props;
          const stringifiedProps = JSON.stringify(props);

          const inlineScript = \`
          const idyllProps =  \${stringifiedProps};

          function defer(method) {
            if (window.p5) {
              method();
            } else {
              setTimeout(()=> { defer(method) }, 50);
            }
          }

          const createSketch = () => {
            const sketch${id} = (p) => {
              for(const [key,value] of Object.entries(idyllProps)){
                eval(\\\`
                  window.\\\${key} = \\\${value};
                \\\`);
              }

              (function(){
                eval(\\\`
                ${contents}
                p.setup = setup;
                p.draw = draw;
                \\\`)
              }).call(p);
            }
            let myp5${id} = new p5(sketch${id}, 'idyll-container-p5-${id}');  
          };

          defer(createSketch);
          \`;
          script.appendChild(document.createTextNode(inlineScript));
          head.appendChild(script);
        }
      }

      shouldComponentUpdate(nextProps) {
        const { hasError, updateProps, idyll, children, ...props } = nextProps;

        for(const [key,value] of Object.entries(props)) {
          eval(\`
            window.\${key} = \${value};
          \`);
        }

        return false;
      }

      render() {
        return (
          <span id='idyll-container-p5-${id}'>

          </span>
        )
      }
    }
    module.exports = p5js${id};
  `
};

module.exports = ast => {
  const vars = getNodesByType(ast, 'var');
  const idyllVars = vars.reduce((acc, node) => {
    const { properties: { name: { value } } } = node;
    acc[`_${value}_`] = { type: "variable", value: value };
    return acc;
  }, {});

  return modifyNodesByName(ast, 'codehighlight', (node) => {
    if (node.properties.language && node.properties.language.value.startsWith('exec:')) {
      const language = node.properties.language.value.replace('exec:', '');
      if (['p5', 'p5js'].indexOf(language.toLowerCase()) > -1) {
        const contents = node.children[0].value;
        contents.split('\n')
        const id = hashCode(contents);
        const fileName = `components/p5js${id}.js`;
        fs.writeFileSync(fileName, buildComponent(contents, id, vars));
        node.name = `p5js${id}`;
        node.properties = { ...idyllVars };
        node.children = [];
      }
    }
    return node;
  })
};