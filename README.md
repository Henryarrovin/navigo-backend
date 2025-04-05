# Navigo Backend️
## Indoor Navigation / Positioning System API

![TypeScript](https://img.shields.io/badge/TypeScript-Supported-blue?logo=typescript)
![Bun](https://img.shields.io/badge/Runtime-Bun-ff69b4)
![Hono](https://img.shields.io/badge/Hono-Framework-FF5700?logo=hono)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)

API for indoor navigation, product management, and spatial mapping with advanced pathfinding algorithms.

## ✨ Features

- **A\* Pathfinding Algorithm** with Euclidean distance heuristics
- **Point-in-Polygon Detection** using ray-casting
- **Product Management** with spatial coordinates
- **Zone Mapping System** with adjacency relationships
- **RESTful API** endpoints with pagination
- **Docker Container** ready for deployment

## 🧮 Algorithms & Formulas

### A* Pathfinding
```javascript
f(n) = g(n) + h(n)
```
- Where:
   - g(n) = actual cost from start to current node
   - h(n) = heuristic estimate to end (Euclidean distance)
   - f(n) = total estimated cost
- Euclidean distance
```javascript
distance = √((x₂ - x₁)² + (y₂ - y₁)²)
```
- Point-in-Polygon (Ray Casting)
```javascript
const intersect = ((yi > point.y) !== (yj > point.y)) 
              && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
```

## 📦 API Endpoints

### 🔹 Products
- `POST /api/products` - Create new product  
- `GET /api/products` - Get all products (paginated)  
- `GET /api/products/:id` - Get product by ID  
- `PUT /api/products/:id` - Update product  
- `DELETE /api/products/:id` - Delete product  
- `GET /api/products/category/:categoryId` - Get products by category 

### 🔹 Categories
- `POST /api/categories` - Create new category  
- `GET /api/categories` - Get all categories  
- `GET /api/categories/:id` - Get category by ID  
- `PUT /api/categories/:id` - Update category  
- `DELETE /api/categories/:id` - Delete category

### 🔹 Map / Navigation
- `POST /api/map/path` - Find path between two points  
- `GET /api/map/zones` - Get all zones  
- `POST /api/map/zones` - Create new zone  
- `GET /api/map/zones/:id` - Get zone by ID  
- `PATCH /api/map/zones/:id` - Update zone  
- `GET /api/map/zones/:id/products` - Get products in a zone  

---

## ⚙️ Technical Implementation

### 🐳 Docker Deployment

- Run the backend in a container using the prebuilt Docker image:
  ```bash
  docker pull henryarrovinproject/navigo-backend
  ```
- Run the container
  ```bash
  docker run -p 8080:8080 -e MONGO_URI="your_mongodb_connection_string" henryarrovinproject/navigo-backend
  ```

### 💻 Local Development

- Clone the repository
  ```bash
  git clone https://github.com/NaviGoProject/navigo-backend.git
  ```
- Create a .env file in the root directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```
- Install dependencies:
  ```bash
  bun install
  ```
- Start the server:
  ```bash
  bun run start
  ```

### 🛠 Tech Stack️

- Language: TypeScript
- Runtime: Bun
- Framework: Hono
- Database: MongoDB
- Containerization: Docker