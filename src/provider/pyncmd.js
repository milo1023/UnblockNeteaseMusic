const select = require('./select');
const request = require('../request');
const { getManagedCacheStorage } = require('../cache');

// Function to fetch track ID based on provided info
const fetchTrackId = (info) => {
    const url = `https://music-api.gdstudio.xyz/api.php?types=search&source=spotify&name=${encodeURIComponent(info.name)}`;
    
    return request('GET', url)
        .then((response) => response.json())
        .then((jsonBody) => {
            //console.log('API response:', jsonBody); // 添加这行用于调试
            if (Array.isArray(jsonBody) && jsonBody.length > 0 && typeof jsonBody[0] === 'object' && 'id' in jsonBody[0]) {
                return jsonBody[0].id;
            } else {
                throw new Error('Invalid response structure for fetching track ID');
            }
        })
        .catch((error) => {
            console.error('Error fetching track ID:', error);
            throw error;
        });
};

// Function to get the track URL based on bitrate
const track = (id) => {
    const bitrate = select.ENABLE_FLAC ? '999' : '320';
    const url = `https://music-api.gdstudio.xyz/api.php?types=url&source=spotify&id=${id}&br=${bitrate}`;

    return request('GET', url)
        .then((response) => response.json())
        .then((jsonBody) => {
            if (jsonBody && typeof jsonBody === 'object' && 'url' in jsonBody) {
                return jsonBody.br > 0 ? 'https://music-api.gdstudio.xyz/'+jsonBody.url : Promise.reject('Invalid bitrate');
            } else {
                throw new Error('Invalid response structure for fetching track URL');
            }
        })
        .catch((error) => {
            console.error('Error fetching track URL:', error);
            throw error;
        });
};

// Cache storage for managing cached data
const cs = getManagedCacheStorage('provider/pyncmd');

// Function to check and cache track info
const check = (info) => {
    return fetchTrackId(info)
        .then((id) => cs.cache({ ...info, id }, () => track(id)))
        .catch((error) => {
            console.error('Error in check function:', error);
            throw error;
        });
};

module.exports = { check };
