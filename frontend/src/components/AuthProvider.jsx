import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '../lib/api'

export default function AuthProvider({ children }) {
  const { getToken } = useAuth()
  // Set synchronously before children render so child useEffect fetches see the token getter
  setTokenGetter(getToken)
  return children
}
