# NomadNodes Indexer (Ponder)

This package indexes NomadNodes smart contract events and provides a GraphQL API for querying blockchain data.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/indexer
npm install
```

### 2. Configure Environment

Update `.env.local` with your settings:

```env
# Get a free API key from https://www.alchemy.com/
PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

# Update after deploying PropertyNFT contract
PROPERTY_NFT_ADDRESS=0xYOUR_CONTRACT_ADDRESS

# Block number when contract was deployed (get from deployment logs)
PROPERTY_NFT_START_BLOCK=12345678
```

### 3. Run Development Server

```bash
npm run dev
```

The indexer will start on `http://localhost:42069`

## 📊 GraphQL API

Once running, access the GraphQL playground at: `http://localhost:42069/graphql`

### Example Queries

#### Get All Active Properties

```graphql
query GetProperties {
  properties(where: { isActive: true }, orderBy: "createdAt", orderDirection: "desc") {
    items {
      id
      propertyId
      location
      propertyType
      totalBookings
      averageRating
      ipfsMetadataHash
      hostWallet
    }
  }
}
```

#### Search Properties by Location

```graphql
query SearchByLocation($location: String!) {
  properties(where: { isActive: true, location_contains: $location }) {
    items {
      id
      location
      propertyType
      totalBookings
    }
  }
}
```

#### Get Room Types for a Property

```graphql
query GetRoomTypes($propertyId: String!) {
  roomTypes(where: { propertyId: $propertyId, isActive: true, isDeleted: false }) {
    items {
      id
      tokenId
      name
      maxSupply
      maxGuests
      minStayNights
      maxStayNights
    }
  }
}
```

#### Get User Bookings

```graphql
query GetUserBookings($traveler: String!) {
  bookings(where: { traveler: $traveler }, orderBy: "createdAt", orderDirection: "desc") {
    items {
      id
      checkIn
      checkOut
      status
      propertyId
      roomTypeId
    }
  }
}
```

#### Get Available Rooms (with filters)

```graphql
query SearchAvailableRooms($checkIn: BigInt!, $checkOut: BigInt!, $minGuests: BigInt!) {
  roomTypes(where: { isActive: true, isDeleted: false, maxGuests_gte: $minGuests }) {
    items {
      id
      tokenId
      name
      maxSupply
      maxGuests
      propertyId
    }
  }
}
```

## 🗄️ Database Schema

### Property

- `id`: Property ID
- `hostWallet`: Host's wallet address
- `location`: Property location
- `propertyType`: hotel, villa, apartment, cabin
- `totalBookings`: Number of bookings
- `averageRating`: Average rating (basis points)
- `ipfsMetadataHash`: IPFS hash for metadata

### RoomType

- `id`: Token ID
- `propertyId`: Parent property ID
- `name`: Room name
- `maxSupply`: Maximum units
- `maxGuests`: Maximum guests per unit
- `minStayNights`: Minimum stay duration
- `maxStayNights`: Maximum stay duration

### Booking

- `id`: Unique booking ID
- `traveler`: Traveler's wallet address
- `checkIn`: Check-in timestamp
- `checkOut`: Check-out timestamp
- `status`: Pending, Confirmed, CheckedIn, Completed, Cancelled
- `propertyId`: Property reference
- `roomTypeId`: Room type reference

### User

- `id`: Wallet address
- `totalBookingsAsTraveler`: Number of bookings made
- `totalPropertiesAsHost`: Number of properties owned

## 🚢 Deployment

### Railway (Recommended)

**See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete deployment guide.**

Quick steps:

1. Push indexer code to GitHub
2. Create new Railway project from GitHub repo
3. Set root directory: `packages/indexer`
4. Add PostgreSQL database
5. Configure environment variables (see `.env.example`)
6. Railway auto-deploys from Dockerfile

Test deployment:

```bash
# Check configuration
node check-config.js

# Build Docker image locally
docker build -t nomadnodes-indexer .
docker run -p 42069:42069 --env-file .env.local nomadnodes-indexer
```

### Environment Variables for Railway

Copy from `.env.example` and set in Railway dashboard:

```env
PONDER_CHAIN=sepolia
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PROPERTY_REGISTRY_ADDRESS=0x...
ROOM_TYPE_NFT_ADDRESS=0x...
BOOKING_MANAGER_ADDRESS=0x...
ESCROW_FACTORY_ADDRESS=0x...
REVIEW_REGISTRY_ADDRESS=0x...
TRAVELER_SBT_ADDRESS=0x...
HOST_SBT_ADDRESS=0x...
START_BLOCK=12345678
```

Railway automatically provides: `DATABASE_URL`

## 📝 Notes

- Ponder uses SQLite by default (dev mode)
- For production, use PostgreSQL via `DATABASE_URL`
- Indexing starts from `PROPERTY_NFT_START_BLOCK`
- Real-time sync with blockchain
- Automatic schema migrations

## 🔗 Links

- [Ponder Documentation](https://ponder.sh)
- [Railway Deployment Guide](https://ponder.sh/docs/production/deploy)
- [GraphQL API Reference](https://ponder.sh/docs/query/graphql)
