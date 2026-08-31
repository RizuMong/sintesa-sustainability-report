import { http, unwrap } from '@/lib/http'

const userProfileApi = {
  async getUserProfile() {
    return unwrap<UserProfile>(http.get('/v1/user/profile'))
  },
}

export { userProfileApi }
