const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');

// Configura la conexión a la base de datos MySQL
const dbConfig = {
  host: 'localhost',
  user: '',
  password: '',
  database: '',
};

// Ruta al archivo SQL que deseas restaurar
const sqlFilePath = 'file.sql';

async function main() {
  try {
    // Crea la conexión a la base de datos
    const connection = await mysql.createConnection(dbConfig);

    // Lee el archivo SQL línea por línea y ejecuta cada sentencia
    const rl = readline.createInterface({
      input: fs.createReadStream(sqlFilePath, 'utf8'),
      terminal: false,
    });

    let query = '';
    let counter = 0;
    const batchSize = 1000; // Puedes ajustar el tamaño del lote según tus necesidades

    rl.on('line', async (line) => {
      // Verifica si la línea no es un comentario de versión
      if (line.trim() !== '' && !line.startsWith('/*')) {
        query += line.trim();
        if (query.endsWith(';')) {
          // Ejecuta la sentencia SQL
          try {
            await connection.query(query);
          } catch (error) {
            console.error('Error en la sentencia SQL:', query);
            console.error('Error detallado:', error);
          }
          query = '';

          // Incrementa el contador para controlar el tamaño del lote
          counter++;
          if (counter >= batchSize) {
            // Cierra la conexión y reinicia el contador
            counter = 0;
            connection.end();

            // Crea una nueva conexión para el siguiente lote
            connection = await mysql.createConnection(dbConfig);
          }
        }
      }
    });

    rl.on('close', () => {
      console.log('Restauración completada.');
      connection.end();
    });
  } catch (error) {
    console.error('Error en la conexión a la base de datos o al leer el archivo SQL:', error);
  }
}

// Ejecuta el proceso principal
main();
